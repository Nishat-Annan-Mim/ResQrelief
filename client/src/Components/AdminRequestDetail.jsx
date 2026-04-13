import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "./AdminHome.css";
import "./AdminRequestDetail.css";

const BASE = "http://localhost:3001";

const AdminRequestDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [req, setReq]           = useState(state?.req || null);
  const [done, setDone]         = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  // volunteer assign state
  const [volunteers, setVolunteers]     = useState([]);
  const [loadingVols, setLoadingVols]   = useState(false);
  const [selectedVol, setSelectedVol]   = useState(null);
  const [showVolPanel, setShowVolPanel] = useState(false);
  const [volSearch, setVolSearch]       = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [assignError, setAssignError]   = useState("");

  // confirm modals
  const [confirmModal, setConfirmModal] = useState(null);

  // AI states
  const [aiResources, setAiResources]   = useState(null);
  const [aiVolMatch, setAiVolMatch]     = useState(null);
  const [loadingAiRes, setLoadingAiRes] = useState(false);
  const [loadingAiVol, setLoadingAiVol] = useState(false);

  // Inquiry / messaging
  const [replyText, setReplyText]   = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const adminEmail = sessionStorage.getItem("email") || "admin1@resqrelief.com";
  const adminName  = sessionStorage.getItem("name")  || "Admin";

  // ── Fetch fresh request data ────────────────────────────────────────
  const fetchReq = async () => {
    try {
      const res = await axios.get(`${BASE}/api/requests/${id}`);
      setReq(res.data);
    } catch { /* use state data */ }
  };

  useEffect(() => {
    if (!req) fetchReq();
    else fetchReq(); // always refresh to get latest status/inquiries

    // Socket: refresh when volunteer sends update
    socketRef.current = io(BASE, { transports: ["websocket", "polling"] });
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", adminEmail);
    });
    socketRef.current.on("alert", () => fetchReq());

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [id]);

  // Load ALL volunteers when panel opens
  useEffect(() => {
    if (!showVolPanel) return;
    setLoadingVols(true);
    axios
      .get(`${BASE}/api/volunteers/all`)
      .then((res) => setVolunteers(res.data))
      .catch(() => setVolunteers([]))
      .finally(() => setLoadingVols(false));
  }, [showVolPanel]);

  // ── Actions ──────────────────────────────────────────────────────────

  const handleVerify = async () => {
    setConfirmModal(null);
    setAssignError("");
    try {
      await axios.put(`${BASE}/api/requests/${id}/verify`, {
        assignedVolunteer: selectedVol
          ? { name: selectedVol.fullName, email: selectedVol.email, phone: selectedVol.phone }
          : null,
      });
      setDoneMessage(
        "✅ Request has been verified" +
        (selectedVol ? ` and assigned to ${selectedVol.fullName}!` : "!")
      );
      setDone(true);
    } catch (err) {
      if (err.response?.data?.limitReached) {
        setAssignError(err.response.data.message);
        setConfirmModal(null);
      } else {
        setDoneMessage("✅ Request has been verified!");
        setDone(true);
      }
    }
  };

  const handleFraud = async () => {
    setConfirmModal(null);
    await axios.delete(`${BASE}/api/requests/${id}`);
    setDoneMessage("🚫 Request marked as fraud. Submitter has been banned.");
    setDone(true);
  };

  const handleMarkComplete = async () => {
    if (!window.confirm("Mark this request as officially completed? The user and volunteer will both be notified.")) return;
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
    } catch { alert("AI resource allocation failed. Try again."); }
    finally { setLoadingAiRes(false); }
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
    } catch { alert("AI volunteer matching failed. Try again."); }
    finally { setLoadingAiVol(false); }
  };

  const filteredVols = volunteers.filter((v) => {
    const matchesSearch = `${v.fullName} ${v.volunteerRole} ${v.preferredZone}`
      .toLowerCase().includes(volSearch.toLowerCase());
    const matchesDistrict = districtFilter.trim() === "" ||
      (v.preferredZone || "").toLowerCase().includes(districtFilter.trim().toLowerCase());
    return matchesSearch && matchesDistrict;
  });

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1)    return "just now";
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const statusColor = (s) =>
    s === "pending"        ? "#c0392b" :
    s === "verified"       ? "#1d4ed8" :
    s === "in_progress"    ? "#b45309" :
    s === "volunteer_done" ? "#16a34a" :
    s === "completed"      ? "#4338ca" : "#888";

  const statusLabel = (s) =>
    s === "in_progress"    ? "In Progress " :
    s === "volunteer_done" ? "Volunteer Done  — Awaiting your review" :
    s === "completed"      ? "Completed 🏁" : s;

  if (!req) return <div style={{ padding: "40px", color: "#888" }}>Loading...</div>;

  if (done) {
    return (
      <div className="ard-done-screen">
        <div className="ard-done-card">
          <p className="ard-done-msg">{doneMessage}</p>
          <button className="btn-admin" onClick={() => navigate("/admin-requests")}>
            ← Back to Requests
          </button>
        </div>
      </div>
    );
  }

  // Completed view
  if (req.status === "completed") {
    return (
      <div className="detail-page">
        <h1 className="detail-title">
          {req.district}{req.fullAddress ? `, ${req.fullAddress}` : ""}
        </h1>
        <div style={{
          background: "#fff", border: "1px solid #e8e4dc", borderRadius: "12px",
          padding: "40px", textAlign: "center", maxWidth: "500px", margin: "0 auto",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏁</div>
          <h2 style={{ color: "#4338ca", marginBottom: "8px" }}>Request Completed</h2>
          <p style={{ color: "#555" }}>
            Closed on {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : "—"}.
            {req.assignedVolunteer && ` Handled by ${req.assignedVolunteer.name}.`}
          </p>
          <button className="btn-admin" style={{ marginTop: "20px" }} onClick={() => navigate("/admin-requests")}>
            ← Back to Requests
          </button>
        </div>
      </div>
    );
  }

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
                  {selectedVol
                    ? `Verify this request and assign it to ${selectedVol.fullName}?`
                    : "Verify this request without assigning a volunteer?"}
                </p>
                <div className="ard-modal-btns">
                  <button className="btn-verify" onClick={handleVerify}>Yes, Verify</button>
                  <button className="btn-cancel" onClick={() => setConfirmModal(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h3>Mark as Fraud?</h3>
                <p>
                  This will <strong>permanently delete</strong> the request and{" "}
                  <strong>ban</strong> the phone number{" "}
                  <code>{req.phoneNumber}</code> from submitting future requests.
                </p>
                <div className="ard-modal-btns">
                  <button className="btn-fraud" onClick={handleFraud}>Yes, Ban & Delete</button>
                  <button className="btn-cancel" onClick={() => setConfirmModal(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <h1 className="detail-title">
        {req.district}{req.fullAddress ? `, ${req.fullAddress}` : ""}
      </h1>

      <div className="detail-layout">
        {/* LEFT — Request Details */}
        <div className="detail-left">
          <div className="detail-card">
            <h3>Request Details</h3>
            <table className="detail-table">
              <tbody>
                <tr><td>Aid Requested</td><td><strong>{req.aidTypes?.join(" + ") || "—"}</strong></td></tr>
                <tr><td>People Affected</td><td><strong>{req.peopleAffected}</strong></td></tr>
                <tr>
                  <td>Priority</td>
                  <td>
                    <span className={`priority-label priority-${req.priority?.toLowerCase()}`}>
                      {req.priority || "—"}
                    </span>
                  </td>
                </tr>
                <tr><td>Submitted by</td><td><strong>{req.fullName}</strong></td></tr>
                <tr><td>Phone</td><td><strong>{req.phoneNumber}</strong></td></tr>
                <tr><td>District</td><td><strong>{req.district}</strong></td></tr>
              </tbody>
            </table>
          </div>

          {req.additionalDetails && (
            <div className="detail-card" style={{ marginTop: "20px" }}>
              <h3>Description</h3>
              <p style={{ fontStyle: "italic", color: "#444", lineHeight: "1.7" }}>
                "{req.additionalDetails}"
              </p>
            </div>
          )}

          {/* Assigned volunteer display */}
          {req.assignedVolunteer && (
            <div className="detail-card ard-assigned-card" style={{ marginTop: "20px" }}>
              <h3>Assigned Volunteer</h3>
              <p><strong>{req.assignedVolunteer.name}</strong></p>
              <p style={{ color: "#666" }}>{req.assignedVolunteer.email}</p>
              <p style={{ color: "#666" }}>{req.assignedVolunteer.phone}</p>
              {(req.status === "in_progress" || req.status === "volunteer_done") && (
                <div style={{
                  marginTop: "10px", padding: "8px 14px", borderRadius: "8px",
                  background: req.status === "volunteer_done" ? "#d1fae5" : "#fef3c7",
                  color: req.status === "volunteer_done" ? "#065f46" : "#92400e",
                  fontSize: "13px", fontWeight: 600,
                }}>
                  {req.status === "in_progress"
                    ? "Currently working on this request"
                    : "Volunteer has marked this as done — awaiting your review"}
                </div>
              )}
            </div>
          )}

          {/* ── Inquiry / Messaging Thread ── */}
          {req.assignedVolunteer && (
            <div className="detail-card" style={{ marginTop: "20px" }}>
              <h3>Volunteer Messages</h3>

              {(!req.inquiries || req.inquiries.length === 0) ? (
                <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "16px" }}>
                  No messages yet. Volunteer can reach out from their assignment page.
                </p>
              ) : (
                <div style={{ marginBottom: "16px" }}>
                  {req.inquiries.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", flexDirection: "column",
                        alignItems: msg.from === "admin" ? "flex-end" : "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{
                        maxWidth: "80%", padding: "10px 14px",
                        borderRadius: msg.from === "admin" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: msg.from === "admin" ? "#c0392b" : "#f0ece4",
                        color: msg.from === "admin" ? "#fff" : "#1a1a1a",
                        fontSize: "14px", lineHeight: "1.5",
                      }}>
                        {msg.message}
                      </div>
                      <span style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                        {msg.from === "admin" ? "You (Admin)" : msg.senderName} · {timeAgo(msg.sentAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <textarea
                  placeholder="Type a reply to the volunteer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                  style={{
                    width: "100%", border: "1px solid #e8e4dc", borderRadius: "8px",
                    padding: "10px 14px", fontSize: "14px", resize: "vertical",
                    fontFamily: "inherit", boxSizing: "border-box", minHeight: "72px",
                  }}
                />
                <button
                  className="btn-verify"
                  style={{ alignSelf: "flex-end", opacity: sendingReply || !replyText.trim() ? 0.5 : 1 }}
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                >
                  {sendingReply ? "Sending..." : "Reply →"}
                </button>
              </div>
            </div>
          )}

          {/* Volunteer selector panel */}
          {showVolPanel && (
            <div className="detail-card ard-vol-panel" style={{ marginTop: "20px" }}>
              <div className="ard-vol-panel-header">
                <h3>Select a Volunteer</h3>
                <button className="ard-close-btn" onClick={() => setShowVolPanel(false)}>✕</button>
              </div>
              <p className="ard-vol-subtitle">
                Showing all volunteers · filter by district or name below
              </p>
              <input
                className="ard-vol-search"
                type="text"
                placeholder="Filter by district (e.g. Dhaka, Sylhet...)"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                style={{ marginBottom: "8px" }}
              />
              <input
                className="ard-vol-search"
                placeholder="Search by name, role..."
                value={volSearch}
                onChange={(e) => setVolSearch(e.target.value)}
              />
              {loadingVols ? (
                <p style={{ color: "#aaa", padding: "12px 0" }}>Loading volunteers...</p>
              ) : filteredVols.length === 0 ? (
                <p style={{ color: "#aaa", padding: "12px 0" }}>No volunteers found.</p>
              ) : (
                <div className="ard-vol-list">
                  {filteredVols.map((v) => (
                    <div
                      key={v._id}
                      className={`ard-vol-card ${selectedVol?._id === v._id ? "ard-vol-selected" : ""}`}
                      onClick={() => { setSelectedVol(v); setAssignError(""); }}
                    >
                      <div className="ard-vol-name">{v.fullName}</div>
                      <div className="ard-vol-meta">
                        {v.volunteerRole || "—"} · {v.preferredZone || "—"}
                      </div>
                      <div className="ard-vol-meta">{v.phone}</div>
                      {v.preferredTime && (
                        <div className="ard-vol-time">{v.preferredTime}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedVol && (
                <div className="ard-selected-badge">
                  ✓ Selected: <strong>{selectedVol.fullName}</strong>
                  <button className="ard-clear-btn" onClick={() => setSelectedVol(null)}>Clear</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Actions */}
        <div className="detail-right">

          {/* Status card */}
          <div className="detail-card">
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "6px" }}>Status</p>
            <p style={{ fontWeight: "700", fontSize: "18px", textTransform: "capitalize", color: statusColor(req.status) }}>
              {statusLabel(req.status)}
            </p>
          </div>

          {/* ── MARK COMPLETE — shown only when volunteer has marked done ── */}
          {req.status === "volunteer_done" && (
            <div className="detail-card" style={{ marginTop: "16px", background: "#f0fdf4", border: "1px solid #86efac" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#065f46" }}>Ready to Close</h3>
              <p style={{ fontSize: "14px", color: "#166534", marginBottom: "16px" }}>
                {req.assignedVolunteer?.name} has completed their work. Review and mark this request as officially done.
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

          {/* Assign + Verify/Fraud — only for pending requests */}
          {req.status === "pending" && (
            <>
              {assignError && (
                <div style={{
                  marginTop: "12px", padding: "10px 14px", background: "#fef3c7",
                  border: "1px solid #fde68a", borderRadius: "8px",
                  color: "#92400e", fontSize: "13px",
                }}>
                  ⚠️ {assignError}
                </div>
              )}

              <div className="detail-card" style={{ marginTop: "16px" }}>
                <button
                  className="btn-admin"
                  style={{ width: "100%" }}
                  onClick={() => setShowVolPanel((p) => !p)}
                >
                  {showVolPanel ? "▲ Hide Volunteers" : "Assign Volunteer"}
                </button>
                {selectedVol && (
                  <p style={{ marginTop: "10px", fontSize: "13px", color: "#16a34a" }}>
                    ✓ {selectedVol.fullName} selected
                  </p>
                )}
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

          {/* ── AI Resource Allocation ── */}
          <div className="detail-card" style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>AI Resource Allocation</h3>
              <button className="btn-admin" onClick={handleAiResourceAllocation} disabled={loadingAiRes}>
                {loadingAiRes ? "Analyzing..." : "Recommend Resources"}
              </button>
            </div>
            {aiResources && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: "#555", fontStyle: "italic", marginBottom: "12px" }}>{aiResources.summary}</p>
                <table className="detail-table">
                  <thead>
                    <tr>
                      <th style={{ color: "#888", fontSize: "13px" }}>Item</th>
                      <th style={{ color: "#888", fontSize: "13px" }}>Qty</th>
                      <th style={{ color: "#888", fontSize: "13px" }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiResources.recommendations.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.item}</strong></td>
                        <td>{r.quantity} units</td>
                        <td style={{ color: "#555", fontSize: "13px" }}>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── AI Volunteer Match ── */}
          <div className="detail-card" style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>AI Volunteer Match</h3>
              <button className="btn-admin" onClick={handleAiVolunteerMatch} disabled={loadingAiVol}>
                {loadingAiVol ? "Matching..." : "Find Best Match"}
              </button>
            </div>
            {aiVolMatch && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: "#555", fontStyle: "italic", marginBottom: "12px" }}>{aiVolMatch.summary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {aiVolMatch.matches.map((match, i) => (
                    <div key={i} style={{
                      background: "#f7f4ee", borderRadius: "8px", padding: "12px 16px",
                      border: "1px solid #ddd8ce", display: "flex",
                      justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p style={{ fontWeight: "700", margin: 0 }}>#{i + 1} {match.name}</p>
                        <p style={{ color: "#666", fontSize: "13px", margin: "4px 0 0" }}>{match.reason}</p>
                      </div>
                      <div style={{
                        background: match.matchScore >= 85 ? "#16a34a" : match.matchScore >= 60 ? "#d97706" : "#888",
                        color: "#fff", borderRadius: "999px", padding: "4px 12px",
                        fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap",
                      }}>
                        {match.matchScore}% match
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ color: "#aaa", fontSize: "12px", marginTop: "10px" }}>
                   Use "Assign Volunteer" above to confirm the assignment.
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
