import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "./AdminHome.css";
import "./AdminRequestDetail.css";

const BASE = "https://resqreliefcheck.onrender.com";

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

  const [selectedVol, setSelectedVol] = useState(null);
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

  const [aiResources, setAiResources] = useState(null);
  const [aiVolMatch, setAiVolMatch] = useState(null);
  const [loadingAiRes, setLoadingAiRes] = useState(false);
  const [loadingAiVol, setLoadingAiVol] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const adminEmail = sessionStorage.getItem("email") || "admin1@resqrelief.com";
  const adminName = sessionStorage.getItem("name") || "Admin";

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
      // Try dedicated endpoint first; fall back to filtering all tasks
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

  useEffect(() => {
    if (!req) fetchReq();
    else fetchReq();
    fetchRequestTasks();

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

  const handleVerify = async () => {
    setConfirmModal(null);
    setAssignError("");
    try {
      await axios.put(`${BASE}/api/requests/${id}/verify`, {
        assignedVolunteer: null,
      });
      setDoneMessage("✅ Request has been verified!");
      setDone(true);
    } catch {
      setDoneMessage("✅ Request has been verified!");
      setDone(true);
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

  const handleTaskSubmit = async () => {
    if (!taskForm.title || !taskForm.taskType || !taskForm.description) {
      setTaskModalMsg({
        text: "Please fill in title, type, and description.",
        type: "error",
      });
      return;
    }
    try {
      // Attach requestId so tasks are linked back to this request
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
    setDoneMessage("🚫 Request marked as fraud. Submitter has been banned.");
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
      });
      setAiVolMatch(res.data);
    } catch {
      alert("AI volunteer matching failed. Try again.");
    } finally {
      setLoadingAiVol(false);
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
    return <div style={{ padding: "40px", color: "#888" }}>Loading...</div>;

  if (done) {
    return (
      <div className="ard-done-screen">
        <div className="ard-done-card">
          <p className="ard-done-msg">{doneMessage}</p>
          <button
            className="btn-admin"
            onClick={() => navigate("/admin-requests")}
          >
            ← Back to Requests
          </button>
        </div>
      </div>
    );
  }

  if (req.status === "completed") {
    return (
      <div className="detail-page">
        <h1 className="detail-title">
          {req.district}
          {req.fullAddress ? `, ${req.fullAddress}` : ""}
        </h1>
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

  // Derive unique volunteers assigned via tasks for this request
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

  const canAssignTask = ["pending", "verified", "in_progress"].includes(
    req.status,
  );

  return (
    <div className="detail-page">
      {/* Confirm Modal */}
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

      {/* Task Assignment Modal */}
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
                  placeholder="e.g. Distribute food packs in Feni North"
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
                  <option value="high">🔴 High — Urgent, life-critical</option>
                  <option value="medium">
                    🟠 Medium — Important but not immediate
                  </option>
                  <option value="low">🟢 Low — Can be scheduled</option>
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
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="detail-title">
        {req.district}
        {req.fullAddress ? `, ${req.fullAddress}` : ""}
      </h1>

      <div className="detail-layout">
        {/* LEFT */}
        <div className="detail-left">
          {/* Request Details */}
          <div className="detail-card">
            <h3>Request Details</h3>
            <table className="detail-table">
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
            <div className="detail-card" style={{ marginTop: "20px" }}>
              <h3>Description</h3>
              <p
                style={{
                  fontStyle: "italic",
                  color: "#444",
                  lineHeight: "1.7",
                }}
              >
                "{req.additionalDetails}"
              </p>
            </div>
          )}

          {/* ── Assigned Volunteers Panel ── */}
          <div className="detail-card" style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                👥 Assigned Volunteers
                {assignedVolunteersFromTasks.length > 0 && (
                  <span
                    style={{
                      marginLeft: "8px",
                      background: "#c0392b",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "2px 8px",
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
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Assign New Task
                </button>
              )}
            </div>

            {loadingTasks ? (
              <p style={{ color: "#aaa", fontSize: "14px" }}>Loading...</p>
            ) : assignedVolunteersFromTasks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "#aaa",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  No volunteers assigned yet.
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                  Use "Assign New Task" to dispatch volunteers to this request.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
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
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: "#16a34a",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "16px",
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
                              fontSize: "15px",
                              color: "#1a1a2e",
                            }}
                          >
                            {vol.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#666",
                            }}
                          >
                            {vol.email}
                          </p>
                        </div>
                        <div
                          style={{
                            marginLeft: "auto",
                            fontSize: "12px",
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
                          gap: "6px",
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
                              borderRadius: "6px",
                              padding: "8px 12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span style={{ fontSize: "16px" }}>
                                {TASK_ICONS[t.taskType] || "📌"}
                              </span>
                              <div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#1a1a2e",
                                  }}
                                >
                                  {t.title}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "11px",
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
                                gap: "6px",
                                alignItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 7px",
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
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 8px",
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

          {/* Legacy single assignedVolunteer */}
          {req.assignedVolunteer &&
            !assignedVolunteersFromTasks.find(
              (v) => v.email === req.assignedVolunteer.email,
            ) && (
              <div
                className="detail-card ard-assigned-card"
                style={{ marginTop: "20px" }}
              >
                <h3>Assigned Volunteer</h3>
                <p>
                  <strong>{req.assignedVolunteer.name}</strong>
                </p>
                <p style={{ color: "#666" }}>{req.assignedVolunteer.email}</p>
                <p style={{ color: "#666" }}>{req.assignedVolunteer.phone}</p>
                {(req.status === "in_progress" ||
                  req.status === "volunteer_done") && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background:
                        req.status === "volunteer_done" ? "#d1fae5" : "#fef3c7",
                      color:
                        req.status === "volunteer_done" ? "#065f46" : "#92400e",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {req.status === "in_progress"
                      ? "Currently working on this request"
                      : "Volunteer has marked this as done — awaiting your review"}
                  </div>
                )}
              </div>
            )}

          {/* Messaging Thread */}
          {req.assignedVolunteer && (
            <div className="detail-card" style={{ marginTop: "20px" }}>
              <h3>Volunteer Messages</h3>
              {!req.inquiries || req.inquiries.length === 0 ? (
                <p
                  style={{
                    color: "#aaa",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  No messages yet.
                </p>
              ) : (
                <div style={{ marginBottom: "16px" }}>
                  {req.inquiries.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          msg.from === "admin" ? "flex-end" : "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "10px 14px",
                          borderRadius:
                            msg.from === "admin"
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                          background:
                            msg.from === "admin" ? "#c0392b" : "#f0ece4",
                          color: msg.from === "admin" ? "#fff" : "#1a1a1a",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {msg.message}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#aaa",
                          marginTop: "4px",
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
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
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
                    padding: "10px 14px",
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    minHeight: "72px",
                  }}
                />
                <button
                  className="btn-verify"
                  style={{
                    alignSelf: "flex-end",
                    opacity: sendingReply || !replyText.trim() ? 0.5 : 1,
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

        {/* RIGHT — Actions */}
        <div className="detail-right">
          <div className="detail-card">
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "6px" }}>
              Status
            </p>
            <p
              style={{
                fontWeight: "700",
                fontSize: "18px",
                textTransform: "capitalize",
                color: statusColor(req.status),
              }}
            >
              {statusLabel(req.status)}
            </p>
          </div>

          {req.status === "volunteer_done" && (
            <div
              className="detail-card"
              style={{
                marginTop: "16px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#065f46" }}>
                Ready to Close
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#166534",
                  marginBottom: "16px",
                }}
              >
                {req.assignedVolunteer?.name} has completed their work.
              </p>
              <button
                className="btn-verify"
                style={{ width: "100%" }}
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
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: "8px",
                    color: "#92400e",
                    fontSize: "13px",
                  }}
                >
                  ⚠️ {assignError}
                </div>
              )}
              <div className="detail-card" style={{ marginTop: "16px" }}>
                <button
                  className="btn-admin"
                  style={{ width: "100%" }}
                  onClick={openTaskModal}
                >
                  📋 Assign New Task
                </button>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  className="btn-verify"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmModal({ type: "verify" })}
                >
                  ✅ Verify
                </button>
                <button
                  className="btn-fraud"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmModal({ type: "fraud" })}
                >
                  🚫 Fraud
                </button>
              </div>
            </>
          )}

          {(req.status === "verified" || req.status === "in_progress") && (
            <div className="detail-card" style={{ marginTop: "16px" }}>
              <button
                className="btn-admin"
                style={{ width: "100%" }}
                onClick={openTaskModal}
              >
                📋 Assign New Task
              </button>
            </div>
          )}

          {/* AI Resource Allocation */}
          <div className="detail-card" style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3>AI Resource Allocation</h3>
              <button
                className="btn-admin"
                onClick={handleAiResourceAllocation}
                disabled={loadingAiRes}
              >
                {loadingAiRes ? "Analyzing..." : "Recommend Resources"}
              </button>
            </div>
            {aiResources && (
              <div style={{ marginTop: "16px" }}>
                <p
                  style={{
                    color: "#555",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  {aiResources.summary}
                </p>
                <table className="detail-table">
                  <thead>
                    <tr>
                      <th style={{ color: "#888", fontSize: "13px" }}>Item</th>
                      <th style={{ color: "#888", fontSize: "13px" }}>Qty</th>
                      <th style={{ color: "#888", fontSize: "13px" }}>
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiResources.recommendations.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{r.item}</strong>
                        </td>
                        <td>{r.quantity} units</td>
                        <td style={{ color: "#555", fontSize: "13px" }}>
                          {r.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Volunteer Match */}
          <div className="detail-card" style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3>AI Volunteer Match</h3>
              <button
                className="btn-admin"
                onClick={handleAiVolunteerMatch}
                disabled={loadingAiVol}
              >
                {loadingAiVol ? "Matching..." : "Find Best Match"}
              </button>
            </div>
            {aiVolMatch && (
              <div style={{ marginTop: "16px" }}>
                <p
                  style={{
                    color: "#555",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  {aiVolMatch.summary}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {aiVolMatch.matches.map((match, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#f7f4ee",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        border: "1px solid #ddd8ce",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: "700", margin: 0 }}>
                          #{i + 1} {match.name}
                        </p>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "13px",
                            margin: "4px 0 0",
                          }}
                        >
                          {match.reason}
                        </p>
                      </div>
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
                          padding: "4px 12px",
                          fontWeight: "700",
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {match.matchScore}% match
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  style={{ color: "#aaa", fontSize: "12px", marginTop: "10px" }}
                >
                  Use "Assign New Task" to dispatch the matched volunteer.
                </p>
              </div>
            )}
          </div>

          <div className="detail-card" style={{ marginTop: "16px" }}>
            <button
              className="btn-admin"
              style={{ width: "100%", marginTop: "8px" }}
              onClick={() => navigate("/admin-requests")}
            >
              ← Back to Request Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestDetail;
