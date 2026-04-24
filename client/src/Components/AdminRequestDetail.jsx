import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "./AdminHome.css";
import "./AdminRequestDetail.css";

const BASE = "https://resqrelief-fj7z.onrender.com";

const TASK_ICONS = {
  "Food Distribution": "🍱",
  "Medical Aid": "🏥",
  "Transport Coordination": "🚛",
  "Shelter Setup": "🏕️",
  "Search & Rescue": "🔍",
  "Water Supply": "💧",
  Communication: "📡",
  Logistics: "📦",
};

const PRIORITY_COLORS = {
  high: "#c0392b",
  medium: "#e67e22",
  low: "#27ae60",
};

const TASK_STATUS_COLORS = {
  pending: "#e67e22",
  "in-progress": "#2980b9",
  completed: "#27ae60",
  cancelled: "#888",
};

const AdminRequestDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [req, setReq] = useState(state?.req || null);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  const [assignError, setAssignError] = useState("");

  // Tasks assigned to this request
  const [requestTasks, setRequestTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const TASK_TYPES = [
    "Food Distribution",
    "Medical Aid",
    "Transport Coordination",
    "Shelter Setup",
    "Search & Rescue",
    "Water Supply",
    "Communication",
    "Logistics",
  ];

  const AID_TYPE_TO_TASK_TYPE = {
    Medical: "Medical Aid",
    Food: "Food Distribution",
    Shelter: "Shelter Setup",
    Water: "Water Supply",
    Rescue: "Search & Rescue",
    Clothes: "Logistics",
  };

  const emptyTaskForm = {
    title: "",
    taskType: "",
    description: "",
    zone: "",
    priority: "medium",
    dueDate: "",
    assignedTo: { volunteerEmail: "", volunteerName: "", volunteerId: "" },
  };
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskVolunteers, setTaskVolunteers] = useState([]);
  const [taskModalMsg, setTaskModalMsg] = useState({ text: "", type: "" });
  const [confirmModal, setConfirmModal] = useState(null);

  // --- AI States ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeAiView, setActiveAiView] = useState("none"); // "resource", "volunteer", "donation"

  const [aiResources, setAiResources] = useState(null);
  const [aiVolMatch, setAiVolMatch] = useState(null);
  const [aiDonation, setAiDonation] = useState(null);

  const [loadingAiRes, setLoadingAiRes] = useState(false);
  const [loadingAiVol, setLoadingAiVol] = useState(false);
  const [loadingAiDonation, setLoadingAiDonation] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const adminEmail = sessionStorage.getItem("email") || "admin1@resqrelief.com";
  const adminName = sessionStorage.getItem("name") || "Admin";
  const [aiAnalysis, setAiAnalysis] = useState(req?.aiAnalysis || null);
  const [loadingFraud, setLoadingFraud] = useState(false);
  const [showPriorityOverride, setShowPriorityOverride] = useState(false);
  const [overridePriority, setOverridePriority] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchReq = async () => {
    try {
      const res = await axios.get(`${BASE}/api/requests/${id}`);
      setReq(res.data);
    } catch {
      /* use state data */
    }
  };

  const fetchRequestTasks = async () => {
    setLoadingTasks(true);
    try {
      let tasks = [];
      try {
        const res = await axios.get(`${BASE}/api/tasks/request/${id}`);
        tasks = res.data;
      } catch {
        const res = await axios.get(`${BASE}/api/tasks`);
        tasks = res.data.filter((t) => t.requestId === id);
      }
      setRequestTasks(tasks);
    } catch {
      setRequestTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };
  // inside the existing useEffect where fetchReq() is called
  const fetchFraudAnalysis = async () => {
    if (req?.aiAnalysis?.verdict) {
      setAiAnalysis(req.aiAnalysis);
      return;
    }
    setLoadingFraud(true);
    try {
      const res = await axios.get(`${BASE}/api/requests/${id}/fraud-analysis`);
      setAiAnalysis(res.data);
    } catch {
      setAiAnalysis(null);
    } finally {
      setLoadingFraud(false);
    }
  };

  useEffect(() => {
    if (!req) fetchReq();
    else fetchReq();
    fetchRequestTasks();
    fetchFraudAnalysis();

    socketRef.current = io(BASE, { transports: ["websocket", "polling"] });
    socketRef.current.on("connect", () =>
      socketRef.current.emit("join", adminEmail),
    );
    socketRef.current.on("alert", () => {
      fetchReq();
      fetchRequestTasks();
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!showTaskModal) return;
    axios
      .get(`${BASE}/api/volunteers/all`)
      .then((res) =>
        setTaskVolunteers(
          res.data.filter((v) => v.volunteerRole && v.volunteerRole !== ""),
        ),
      )
      .catch(() => setTaskVolunteers([]));
  }, [showTaskModal]);

  // AFTER
  const handleVerify = async () => {
    setConfirmModal(null);
    setAssignError("");
    try {
      const res = await axios.put(`${BASE}/api/requests/${id}/verify`, {
        assignedVolunteer: null,
      });
      setReq(res.data);
    } catch (err) {
      console.error("Verify failed:", err);
      alert("Request verification failed. Please try again.");
    }
  };

  const handleTaskVolunteerSelect = (e) => {
    const email = e.target.value;
    const vol = taskVolunteers.find((v) => v.email === email);
    setTaskForm({
      ...taskForm,
      assignedTo: {
        volunteerEmail: email,
        volunteerName: vol ? vol.fullName : "",
        volunteerId: vol ? vol._id : "",
      },
    });
  };
  const handlePriorityOverride = async () => {
    if (!overridePriority || !overrideReason.trim()) {
      alert("Please select a priority and provide a reason.");
      return;
    }
    setSavingOverride(true);
    try {
      const res = await axios.put(`${BASE}/api/requests/${id}/priority`, {
        priority: overridePriority,
        overrideReason: overrideReason.trim(),
        adminEmail: adminEmail,
      });
      setReq(res.data);
      setShowPriorityOverride(false);
      setOverrideReason("");
    } catch {
      alert("Failed to override priority.");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title || !taskForm.taskType || !taskForm.description) {
      setTaskModalMsg({
        text: "Please fill in title, type, and description.",
        type: "error",
      });
      return;
    }
    try {
      await axios.post(`${BASE}/api/tasks`, { ...taskForm, requestId: id });
      setTaskModalMsg({
        text: taskForm.assignedTo.volunteerEmail
          ? "Task created and volunteer notified!"
          : "Task created successfully!",
        type: "success",
      });
      setTimeout(() => {
        setShowTaskModal(false);
        setTaskForm(emptyTaskForm);
        setTaskModalMsg({ text: "", type: "" });
        fetchRequestTasks();
      }, 1400);
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error;
      setTaskModalMsg({
        text: serverMsg
          ? `Failed: ${serverMsg}`
          : "Failed to create task. Please try again.",
        type: "error",
      });
    }
  };

  const handleFraud = async () => {
    setConfirmModal(null);
    await axios.delete(`${BASE}/api/requests/${id}`);
    setDoneMessage(" Request marked as fraud. Submitter has been banned.");
    setDone(true);
  };

  const handleMarkComplete = async () => {
    if (!window.confirm("Mark this request as officially completed?")) return;
    try {
      const res = await axios.put(`${BASE}/api/requests/${id}/complete`);
      setReq(res.data);
    } catch {
      alert("Failed to mark as complete. Please try again.");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await axios.post(`${BASE}/api/requests/${id}/inquiry/reply`, {
        message: replyText.trim(),
        adminEmail,
        adminName,
      });
      setReq(res.data);
      setReplyText("");
    } catch {
      alert("Failed to send reply. Try again.");
    } finally {
      setSendingReply(false);
    }
  };

  // --- AI Handlers ---
  const handleAiResourceAllocation = async () => {
    setLoadingAiRes(true);
    try {
      const res = await axios.post(`${BASE}/api/ai/resource-allocation`, {
        aidTypes: req.aidTypes,
        peopleAffected: req.peopleAffected,
        district: req.district,
        description: req.additionalDetails,
      });
      setAiResources(res.data);
    } catch {
      alert("AI resource allocation failed. Try again.");
    } finally {
      setLoadingAiRes(false);
    }
  };

  const handleAiVolunteerMatch = async () => {
    setLoadingAiVol(true);
    try {
      const res = await axios.post(`${BASE}/api/ai/volunteer-match`, {
        aidTypes: req.aidTypes,
        peopleAffected: req.peopleAffected,
        district: req.district,
        description: req.additionalDetails,
        latitude: req.latitude,
        longitude: req.longitude,
        requestId: id,
      });
      setAiVolMatch(res.data);
      if (taskVolunteers.length === 0)
        axios
          .get(`${BASE}/api/volunteers/all`)
          .then((r) =>
            setTaskVolunteers(r.data.filter((v) => v.volunteerRole)),
          );
    } catch {
      alert("AI volunteer matching failed. Try again.");
    } finally {
      setLoadingAiVol(false);
    }
  };

  const handleAiDonationAllocation = async () => {
    setLoadingAiDonation(true);
    try {
      const res = await axios.post(`${BASE}/api/ai/donation-allocation`, {
        district: req.district,
        aidTypes: req.aidTypes,
        peopleAffected: req.peopleAffected,
        priority: req.priority,
        description: req.additionalDetails,
      });
      setAiDonation(res.data);
    } catch {
      alert("AI donation allocation failed. Try again.");
    } finally {
      setLoadingAiDonation(false);
    }
  };

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const statusColor = (s) =>
    s === "pending"
      ? "#c0392b"
      : s === "verified"
        ? "#1d4ed8"
        : s === "in_progress"
          ? "#b45309"
          : s === "volunteer_done"
            ? "#16a34a"
            : s === "completed"
              ? "#4338ca"
              : "#888";

  const statusLabel = (s) =>
    s === "in_progress"
      ? "In Progress"
      : s === "volunteer_done"
        ? "Volunteer Done — Awaiting your review"
        : s === "completed"
          ? "Completed 🏁"
          : s;

  if (!req)
    return (
      <div
        style={{
          padding: "40px",
          color: "#888",
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        Loading Request Details...
      </div>
    );

  if (done) {
    return (
      <div className="ard-done-screen">
        <div className="ard-done-card">
          <p className="ard-done-msg">{doneMessage}</p>
          <button
            className="btn-admin"
            onClick={() => navigate("/admin-requests")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (req.status === "completed") {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <button
            className="btn-admin"
            style={{
              padding: "10px 18px",
              background: "#fff",
              color: "#1a1a2e",
              border: "1.5px solid #ddd",
            }}
            onClick={() => navigate("/admin-requests")}
          >
            ← Back
          </button>
          <h1 className="detail-title" style={{ margin: 0, fontSize: "32px" }}>
            {req.district}
            {req.fullAddress ? `, ${req.fullAddress}` : ""}
          </h1>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e4dc",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏁</div>
          <h2 style={{ color: "#4338ca", marginBottom: "8px" }}>
            Request Completed
          </h2>
          <p style={{ color: "#555" }}>
            Closed on{" "}
            {req.completedAt
              ? new Date(req.completedAt).toLocaleDateString()
              : "—"}
            .
            {req.assignedVolunteer &&
              ` Handled by ${req.assignedVolunteer.name}.`}
          </p>
          <button
            className="btn-admin"
            style={{ marginTop: "20px" }}
            onClick={() => navigate("/admin-requests")}
          >
            ← Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const assignedVolunteersFromTasks = (() => {
    const seen = new Set();
    return requestTasks
      .filter((t) => t.assignedTo?.volunteerEmail)
      .filter((t) => {
        if (seen.has(t.assignedTo.volunteerEmail)) return false;
        seen.add(t.assignedTo.volunteerEmail);
        return true;
      })
      .map((t) => ({
        name: t.assignedTo.volunteerName,
        email: t.assignedTo.volunteerEmail,
      }));
  })();

  const openTaskModal = () => {
    setTaskForm({ ...emptyTaskForm, zone: req.district || "" });
    setTaskModalMsg({ text: "", type: "" });
    setShowTaskModal(true);
  };

  const openTaskModalWithVolunteer = (volunteerName) => {
    const vol = taskVolunteers.find((v) => v.fullName === volunteerName);
    setTaskForm({
      ...emptyTaskForm,
      zone: req.district || "",
      assignedTo: {
        volunteerEmail: vol?.email || "",
        volunteerName: vol?.fullName || volunteerName,
        volunteerId: vol?._id || "",
      },
    });
    setTaskModalMsg({ text: "", type: "" });
    setShowAiModal(false);
    setShowTaskModal(true);
  };
  const handleAiAssignVolunteer = async (match) => {
    const vol = taskVolunteers.find((v) => v.fullName === match.name);
    if (!vol) {
      alert("Volunteer details not loaded yet. Please try again.");
      return;
    }

    const taskData = {
      title: `${req.aidTypes?.join(" + ")} - ${req.district}`,
      taskType: AID_TYPE_TO_TASK_TYPE[req.aidTypes?.[0]] || "Logistics",
      description: `AI-assigned task based on skill match. ${match.reason}`,
      zone: req.district || "",
      priority: req.priority?.toLowerCase() || "medium",
      dueDate: "",
      assignedTo: {
        volunteerEmail: vol.email,
        volunteerName: vol.fullName,
        volunteerId: vol._id,
      },
      requestId: id,
    };

    try {
      await axios.post(`${BASE}/api/tasks`, taskData);
      setShowAiModal(false);
      setAiVolMatch(null);
      fetchRequestTasks();
      alert(`✅ ${vol.fullName} has been assigned successfully!`);
    } catch (err) {
      alert("Failed to assign volunteer. Please try again.");
    }
  };

  const canAssignTask = ["pending", "verified", "in_progress"].includes(
    req.status,
  );

  return (
    <div className="detail-page">
      {/* ── AI MODAL OVERLAY ── */}
      {showAiModal && (
        <div className="ai-modal-overlay" onClick={() => setShowAiModal(false)}>
          <div
            className="ai-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ai-modal-header">
              <h2>
                {activeAiView === "resource" && " Suggested Resources"}
                {activeAiView === "volunteer" && " Best Volunteer Matches"}
                {activeAiView === "donation" && " Budget Suggestion"}
              </h2>
              <button
                className="ai-modal-close"
                onClick={() => setShowAiModal(false)}
              >
                ×
              </button>
            </div>

            <div className="ai-modal-body">
              {/* View: Resource Allocation */}
              {activeAiView === "resource" && (
                <div>
                  {loadingAiRes ? (
                    <p style={{ color: "#888", fontSize: "15px" }}>
                      Analyzing required resources...
                    </p>
                  ) : aiResources ? (
                    <div>
                      <p
                        style={{
                          color: "#555",
                          fontStyle: "italic",
                          marginBottom: "20px",
                          fontSize: "16px",
                          lineHeight: "1.6",
                        }}
                      >
                        {aiResources.summary}
                      </p>
                      <table
                        className="detail-table"
                        style={{ fontSize: "15px" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ color: "#888" }}>Item</th>
                            <th style={{ color: "#888" }}>Quantity Required</th>
                            <th style={{ color: "#888" }}>Reasoning</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiResources.recommendations.map((r, i) => (
                            <tr key={i}>
                              <td>
                                <strong>{r.item}</strong>
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {r.quantity}
                              </td>
                              <td style={{ color: "#555" }}>{r.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <button
                      className="btn-admin"
                      style={{ padding: "12px 24px", fontSize: "15px" }}
                      onClick={handleAiResourceAllocation}
                    >
                      Generate Recommendation
                    </button>
                  )}
                </div>
              )}

              {/* View: Volunteer Match */}
              {activeAiView === "volunteer" && (
                <div>
                  {loadingAiVol ? (
                    <p style={{ color: "#888", fontSize: "15px" }}>
                      Scanning database...
                    </p>
                  ) : aiVolMatch ? (
                    <div>
                      <p
                        style={{
                          color: "#555",
                          fontStyle: "italic",
                          marginBottom: "20px",
                          fontSize: "16px",
                          lineHeight: "1.6",
                        }}
                      >
                        {aiVolMatch.summary}
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                        }}
                      >
                        {aiVolMatch.matches.map((match, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#fff",
                              borderRadius: "10px",
                              padding: "20px",
                              border: "1px solid #ddd8ce",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                              }}
                            >
                              <p
                                style={{
                                  fontWeight: "700",
                                  margin: 0,
                                  fontSize: "18px",
                                }}
                              >
                                {match.name}
                              </p>
                              <div
                                style={{
                                  background:
                                    match.matchScore >= 85
                                      ? "#16a34a"
                                      : match.matchScore >= 60
                                        ? "#d97706"
                                        : "#888",
                                  color: "#fff",
                                  borderRadius: "999px",
                                  padding: "6px 14px",
                                  fontWeight: "700",
                                  fontSize: "14px",
                                }}
                              >
                                {match.matchScore}% Match
                              </div>
                            </div>
                            <p
                              style={{
                                color: "#666",
                                fontSize: "15px",
                                lineHeight: "1.5",
                              }}
                            >
                              {match.reason}
                            </p>
                            <button
                              onClick={() => handleAiAssignVolunteer(match)}
                              style={{
                                marginTop: "12px",
                                width: "100%",
                                padding: "8px",
                                background: "#c0392b",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor: "pointer",
                              }}
                            >
                              Assign Task to {match.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-admin"
                      style={{ padding: "12px 24px", fontSize: "15px" }}
                      onClick={handleAiVolunteerMatch}
                    >
                      Find Best Matches
                    </button>
                  )}
                </div>
              )}

              {/* View: Donation Allocation */}
              {activeAiView === "donation" && (
                <div>
                  {loadingAiDonation ? (
                    <p style={{ color: "#888", fontSize: "15px" }}>
                      Calculating budget...
                    </p>
                  ) : aiDonation ? (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "20px",
                          marginBottom: "24px",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            background: "#f0fdf4",
                            border: "1px solid #86efac",
                            borderRadius: "10px",
                            padding: "20px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#16a34a",
                              margin: 0,
                              fontWeight: 700,
                              marginBottom: "8px",
                            }}
                          >
                            AVAILABLE FUNDS
                          </p>
                          <p
                            style={{
                              fontSize: "28px",
                              fontWeight: 700,
                              margin: 0,
                              color: "#166534",
                            }}
                          >
                            ৳{aiDonation.availableFunds?.toLocaleString()}
                          </p>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            borderRadius: "10px",
                            padding: "20px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#b45309",
                              margin: 0,
                              fontWeight: 700,
                              marginBottom: "8px",
                            }}
                          >
                            ESTIMATED NEEDED
                          </p>
                          <p
                            style={{
                              fontSize: "28px",
                              fontWeight: 700,
                              margin: 0,
                              color: "#92400e",
                            }}
                          >
                            ৳{aiDonation.estimatedTotal?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <table
                        className="detail-table"
                        style={{ fontSize: "15px", marginBottom: "20px" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ color: "#888", padding: "12px" }}>
                              Category
                            </th>
                            <th style={{ color: "#888", padding: "12px" }}>
                              Amount
                            </th>
                            <th style={{ color: "#888", padding: "12px" }}>
                              Reasoning
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiDonation.breakdown?.map((b, i) => (
                            <tr key={i}>
                              <td style={{ padding: "12px" }}>
                                <strong style={{ textTransform: "capitalize" }}>
                                  {b.category}
                                </strong>
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ৳{b.amount?.toLocaleString()}
                              </td>
                              <td style={{ padding: "12px", color: "#555" }}>
                                {b.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <p
                        style={{
                          fontStyle: "italic",
                          color: "#666",
                          fontSize: "15px",
                          lineHeight: "1.7",
                        }}
                      >
                        {aiDonation.reasoning}
                      </p>
                    </div>
                  ) : (
                    <button
                      className="btn-admin"
                      style={{ padding: "12px 24px", fontSize: "15px" }}
                      onClick={handleAiDonationAllocation}
                    >
                      Suggest Allocation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modals ── */}
      {confirmModal && (
        <div className="ard-overlay">
          <div className="ard-modal">
            {confirmModal.type === "verify" ? (
              <>
                <h3>Confirm Verification</h3>
                <p>
                  Verify this request? You can assign tasks to volunteers after
                  verification.
                </p>
                <div className="ard-modal-btns">
                  <button className="btn-verify" onClick={handleVerify}>
                    Yes, Verify
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setConfirmModal(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Mark as Fraud?</h3>
                <p>
                  This will <strong>permanently delete</strong> the request and{" "}
                  <strong>ban</strong> the phone number{" "}
                  <code>{req.phoneNumber}</code>.
                </p>
                <div className="ard-modal-btns">
                  <button className="btn-fraud" onClick={handleFraud}>
                    Yes, Ban & Delete
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setConfirmModal(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Task Assignment Modal ── */}
      {showTaskModal && (
        <div className="ard-overlay" onClick={() => setShowTaskModal(false)}>
          <div
            className="ard-modal"
            style={{ maxWidth: "620px", width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "16px" }}>📋 Assign New Task</h3>
            {taskModalMsg.text && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  background:
                    taskModalMsg.type === "error" ? "#fef3c7" : "#d1fae5",
                  color: taskModalMsg.type === "error" ? "#92400e" : "#065f46",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {taskModalMsg.type === "error" ? "⚠️" : "✅"}{" "}
                {taskModalMsg.text}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Task Title *
                </label>
                <input
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  placeholder="e.g. Distribute food packs"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Task Type *
                </label>
                <select
                  value={taskForm.taskType}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, taskType: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select task type</option>
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Description *
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  placeholder="Describe the task in detail..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Assign Volunteer
                </label>
                <select
                  value={taskForm.assignedTo.volunteerEmail}
                  onChange={handleTaskVolunteerSelect}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">— Unassigned —</option>
                  {taskVolunteers.map((v) => (
                    <option key={v._id} value={v.email}>
                      {v.fullName} · {v.volunteerRole} · {v.preferredZone}
                      {v.status === "confirmed" ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Zone / Location
                </label>
                <input
                  value={taskForm.zone}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, zone: e.target.value })
                  }
                  placeholder="e.g. Dhaka, Sylhet North"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Priority
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, priority: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="high">🔴 High — Urgent</option>
                  <option value="medium">🟠 Medium — Important</option>
                  <option value="low">🟢 Low — Schedulable</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#888",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, dueDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div className="ard-modal-btns" style={{ marginTop: "20px" }}>
              <button
                className="btn-cancel"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>
              <button className="btn-verify" onClick={handleTaskSubmit}>
                Assign New Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER AREA: Back Button and Title Top Left ── */}
      <div className="detail-header">
        <button
          className="btn-admin"
          style={{
            padding: "10px 18px",
            background: "#fff",
            color: "#1a1a2e",
            border: "1.5px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap",
          }}
          onClick={() => navigate("/admin-requests")}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>←</span> Back to
          Dashboard
        </button>
        <h1
          className="detail-title"
          style={{ margin: 0, fontSize: "32px", lineHeight: "1.2" }}
        >
          {req.district}
          {req.fullAddress ? `, ${req.fullAddress}` : ""}
        </h1>
      </div>

      <div className="detail-layout">
        {/* ── LEFT COLUMN: Information & Messages ── */}
        <div className="detail-left">
          <div className="detail-card">
            <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>
              Request Details
            </h3>
            <table className="detail-table" style={{ fontSize: "15px" }}>
              <tbody>
                <tr>
                  <td>Aid Requested</td>
                  <td>
                    <strong>{req.aidTypes?.join(" + ") || "—"}</strong>
                  </td>
                </tr>
                <tr>
                  <td>People Affected</td>
                  <td>
                    <strong>{req.peopleAffected}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Priority</td>
                  <td>
                    <span
                      className={`priority-label priority-${req.priority?.toLowerCase()}`}
                    >
                      {req.priority || "—"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Submitted by</td>
                  <td>
                    <strong>{req.fullName}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Phone</td>
                  <td>
                    <strong>{req.phoneNumber}</strong>
                  </td>
                </tr>
                <tr>
                  <td>District</td>
                  <td>
                    <strong>{req.district}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {req.additionalDetails && (
            <div className="detail-card" style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>
                Description
              </h3>
              <p
                style={{
                  fontStyle: "italic",
                  color: "#444",
                  lineHeight: "1.8",
                  fontSize: "15px",
                }}
              >
                "{req.additionalDetails}"
              </p>
            </div>
          )}

          {/* Assigned Volunteers Panel */}
          <div className="detail-card" style={{ marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "20px" }}>
                Assigned Volunteers
                {assignedVolunteersFromTasks.length > 0 && (
                  <span
                    style={{
                      marginLeft: "8px",
                      background: "#c0392b",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 700,
                      padding: "2px 10px",
                    }}
                  >
                    {assignedVolunteersFromTasks.length}
                  </span>
                )}
              </h3>
              {canAssignTask && (
                <button
                  onClick={openTaskModal}
                  style={{
                    background: "#c0392b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Assign New Task
                </button>
              )}
            </div>

            {loadingTasks ? (
              <p style={{ color: "#aaa", fontSize: "15px" }}>Loading...</p>
            ) : assignedVolunteersFromTasks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "#aaa",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
                <p style={{ margin: 0, fontSize: "15px" }}>
                  No volunteers assigned yet.
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "14px" }}>
                  Use "Assign New Task" to dispatch volunteers to this request.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {assignedVolunteersFromTasks.map((vol, i) => {
                  const volTasks = requestTasks.filter(
                    (t) => t.assignedTo?.volunteerEmail === vol.email,
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#f6fff6",
                        border: "1.5px solid #d1fae5",
                        borderRadius: "10px",
                        padding: "16px 20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "14px",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: "#16a34a",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "18px",
                            flexShrink: 0,
                          }}
                        >
                          {vol.name?.[0]?.toUpperCase() || "V"}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: "16px",
                              color: "#1a1a2e",
                            }}
                          >
                            {vol.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            {vol.email}
                          </p>
                        </div>
                        <div
                          style={{
                            marginLeft: "auto",
                            fontSize: "13px",
                            color: "#16a34a",
                            fontWeight: 600,
                          }}
                        >
                          {volTasks.length} task
                          {volTasks.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {volTasks.map((t) => (
                          <div
                            key={t._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "#fff",
                              border: "1px solid #e8f4e8",
                              borderRadius: "8px",
                              padding: "10px 14px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <span style={{ fontSize: "18px" }}>
                                {TASK_ICONS[t.taskType] || "📌"}
                              </span>
                              <div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#1a1a2e",
                                  }}
                                >
                                  {t.title}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    color: "#888",
                                  }}
                                >
                                  {t.taskType}
                                  {t.zone ? ` · ${t.zone}` : ""}
                                </p>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  padding: "4px 8px",
                                  borderRadius: "999px",
                                  color: "#fff",
                                  background:
                                    PRIORITY_COLORS[t.priority] || "#888",
                                }}
                              >
                                {t.priority?.toUpperCase()}
                              </span>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  padding: "4px 10px",
                                  borderRadius: "999px",
                                  border: `1.5px solid ${TASK_STATUS_COLORS[t.status] || "#888"}`,
                                  color: TASK_STATUS_COLORS[t.status] || "#888",
                                }}
                              >
                                {t.status === "in-progress"
                                  ? "In Progress"
                                  : t.status.charAt(0).toUpperCase() +
                                    t.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Volunteer Messages */}
          {req.assignedVolunteer && (
            <div className="detail-card" style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>
                Volunteer Messages
              </h3>
              {!req.inquiries || req.inquiries.length === 0 ? (
                <p
                  style={{
                    color: "#aaa",
                    fontSize: "15px",
                    marginBottom: "20px",
                  }}
                >
                  No messages yet.
                </p>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  {req.inquiries.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          msg.from === "admin" ? "flex-end" : "flex-start",
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "12px 16px",
                          borderRadius:
                            msg.from === "admin"
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                          background:
                            msg.from === "admin" ? "#c0392b" : "#f0ece4",
                          color: msg.from === "admin" ? "#fff" : "#1a1a1a",
                          fontSize: "15px",
                          lineHeight: "1.6",
                        }}
                      >
                        {msg.message}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#aaa",
                          marginTop: "6px",
                        }}
                      >
                        {msg.from === "admin" ? "You (Admin)" : msg.senderName}{" "}
                        · {timeAgo(msg.sentAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <textarea
                  placeholder="Type a reply to the volunteer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                  style={{
                    width: "100%",
                    border: "1px solid #e8e4dc",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "15px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    minHeight: "80px",
                  }}
                />
                <button
                  className="btn-verify"
                  style={{
                    alignSelf: "flex-end",
                    opacity: sendingReply || !replyText.trim() ? 0.5 : 1,
                    padding: "10px 20px",
                  }}
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                >
                  {sendingReply ? "Sending..." : "Reply →"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Actions, Status & AI Triggers ── */}
        <div className="detail-right">
          {/* Current Status */}
          <div className="detail-card">
            <p style={{ color: "#888", fontSize: "15px", marginBottom: "8px" }}>
              Current Status
            </p>
            <p
              style={{
                fontWeight: "700",
                fontSize: "22px",
                textTransform: "capitalize",
                color: statusColor(req.status),
                margin: 0,
              }}
            >
              {statusLabel(req.status)}
            </p>
          </div>

          {/* AI Priority + Override */}
          <div className="detail-card" style={{ marginTop: "24px" }}>
            <p
              style={{
                color: "#888",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                margin: "0 0 10px 0",
              }}
            >
              AI Priority Classification
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span
                className={`priority-label priority-${req.priority?.toLowerCase()}`}
                style={{ fontSize: "15px", padding: "6px 16px" }}
              >
                {req.priority || "—"}
              </span>
              {req.priorityOverridden && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#b45309",
                    fontWeight: 600,
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "999px",
                    padding: "3px 10px",
                  }}
                >
                  Admin Override
                </span>
              )}
            </div>
            {req.priorityOverridden && req.overrideReason && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  fontStyle: "italic",
                  margin: "0 0 12px 0",
                  padding: "8px 12px",
                  background: "#f9f9f9",
                  borderRadius: "6px",
                  borderLeft: "3px solid #b45309",
                }}
              >
                "{req.overrideReason}"
              </p>
            )}
            {!showPriorityOverride ? (
              <button
                onClick={() => {
                  setOverridePriority(req.priority || "HIGH");
                  setShowPriorityOverride(true);
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "none",
                  border: "1.5px solid #c0392b",
                  color: "#c0392b",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Override AI Priority
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="HIGH">🔴 HIGH </option>
                  <option value="MEDIUM">🟠 MEDIUM </option>
                  <option value="LOW">🟢 LOW </option>
                </select>
                <textarea
                  placeholder="Reason for override (e.g. AI underestimated flood severity based on field report)"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setShowPriorityOverride(false);
                      setOverrideReason("");
                    }}
                    style={{
                      flex: 1,
                      padding: "9px",
                      background: "none",
                      border: "1.5px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePriorityOverride}
                    disabled={savingOverride}
                    style={{
                      flex: 1,
                      padding: "9px",
                      background: "#c0392b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: savingOverride ? 0.6 : 1,
                    }}
                  >
                    {savingOverride ? "Saving..." : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </div>
          {req.priorityHistory?.length > 0 && (
            <div className="detail-card" style={{ marginTop: "24px" }}>
              <p
                style={{
                  color: "#888",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  margin: "0 0 12px 0",
                }}
              >
                Priority Change Log
              </p>
              {req.priorityHistory
                .slice()
                .reverse()
                .map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                      paddingBottom: "10px",
                      borderBottom:
                        i < req.priorityHistory.length - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                    }}
                  >
                    <span
                      className={`priority-label priority-${h.changedTo?.toLowerCase()}`}
                      style={{
                        fontSize: "12px",
                        padding: "3px 10px",
                        flexShrink: 0,
                      }}
                    >
                      {h.changedTo}
                    </span>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#444",
                          fontStyle: "italic",
                        }}
                      >
                        "{h.reason}"
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: "12px",
                          color: "#aaa",
                        }}
                      >
                        {h.changedBy} · {timeAgo(h.changedAt)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Primary Action Blocks (Moved Above AI) */}
          {req.status === "volunteer_done" && (
            <div
              className="detail-card"
              style={{
                marginTop: "24px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", color: "#065f46" }}>
                Ready to Close
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "#166534",
                  marginBottom: "20px",
                }}
              >
                A volunteer has completed their work.
              </p>
              <button
                className="btn-verify"
                style={{ width: "100%", padding: "14px" }}
                onClick={handleMarkComplete}
              >
                Mark as Completed
              </button>
            </div>
          )}

          {req.status === "pending" && (
            <>
              {assignError && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: "8px",
                    color: "#92400e",
                    fontSize: "14px",
                  }}
                >
                  ⚠️ {assignError}
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                <button
                  className="btn-verify"
                  style={{ flex: 1, padding: "14px" }}
                  onClick={() => setConfirmModal({ type: "verify" })}
                >
                  {" "}
                  Verify
                </button>
                <button
                  className="btn-fraud"
                  style={{ flex: 1, padding: "14px" }}
                  onClick={() => setConfirmModal({ type: "fraud" })}
                >
                  {" "}
                  Fraud
                </button>
              </div>
            </>
          )}
          {/* AI Fraud Analysis */}
          <div
            className="detail-card"
            style={{
              marginTop: "24px",
              background: !aiAnalysis
                ? "#f8f8f8"
                : aiAnalysis.verdict === "LIKELY_FRAUD"
                  ? "#fef2f2"
                  : aiAnalysis.verdict === "SUSPICIOUS"
                    ? "#fffbeb"
                    : "#f0fdf4",
              border: `1px solid ${
                !aiAnalysis
                  ? "#e0e0e0"
                  : aiAnalysis.verdict === "LIKELY_FRAUD"
                    ? "#fca5a5"
                    : aiAnalysis.verdict === "SUSPICIOUS"
                      ? "#fde68a"
                      : "#86efac"
              }`,
            }}
          >
            <h3 style={{ margin: "0 0 8px 0" }}> AI Fraud Analysis</h3>
            {loadingFraud ? (
              <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                Analyzing request...
              </p>
            ) : aiAnalysis ? (
              <>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    margin: "0 0 6px 0",
                  }}
                >
                  {aiAnalysis.fraudScore}
                  <span style={{ fontSize: "14px", color: "#888" }}>/100</span>
                </p>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "13px",
                    background:
                      aiAnalysis.verdict === "LIKELY_FRAUD"
                        ? "#c0392b"
                        : aiAnalysis.verdict === "SUSPICIOUS"
                          ? "#b45309"
                          : "#16a34a",
                    color: "#fff",
                  }}
                >
                  {aiAnalysis.verdict}
                </span>
                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "14px",
                    color: "#555",
                    margin: "10px 0 0",
                  }}
                >
                  {aiAnalysis.reason}
                </p>
              </>
            ) : (
              <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                Analysis unavailable.
              </p>
            )}
          </div>

          {/* ── AI SIDEBAR MENU (Moved Below Primary Actions) ── */}
          <div className="detail-card ai-sidebar-card">
            <h3 className="ai-sidebar-title"> AI Assistant</h3>
            <button
              className="ai-sidebar-btn"
              onClick={() => {
                setActiveAiView("resource");
                setShowAiModal(true);
                if (!aiResources) handleAiResourceAllocation();
              }}
            >
              Suggest Resource Allocation
            </button>
            <button
              className="ai-sidebar-btn"
              onClick={() => {
                setActiveAiView("volunteer");
                setShowAiModal(true);
                handleAiVolunteerMatch();
              }}
            >
              Find Best Volunteers
            </button>
            <button
              className="ai-sidebar-btn"
              onClick={() => {
                setActiveAiView("donation");
                setShowAiModal(true);
                if (!aiDonation) handleAiDonationAllocation();
              }}
            >
              Estimate Budget & Funds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestDetail;
