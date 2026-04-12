import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const BASE = "http://localhost:3001";

// ── Styles ──────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100vh", background: "#fafaf8", padding: "40px 20px" },
  wrap: { maxWidth: "760px", margin: "0 auto" },
  back: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "none", border: "none", cursor: "pointer",
    color: "#888", fontSize: "14px", marginBottom: "24px", padding: 0,
  },
  card: {
    background: "#fff", border: "1px solid #e8e4dc",
    borderRadius: "12px", padding: "24px", marginBottom: "20px",
  },
  h2: { margin: "0 0 18px 0", fontSize: "18px", color: "#1a1a1a" },
  row: { display: "flex", justifyContent: "space-between", padding: "9px 0",
    borderBottom: "1px solid #f0ece4", fontSize: "14px" },
  label: { color: "#888" },
  value: { fontWeight: 600, color: "#1a1a1a", textAlign: "right" },
  statusBadge: (status) => ({
    display: "inline-block", padding: "4px 14px", borderRadius: "999px",
    fontSize: "13px", fontWeight: 700,
    background:
      status === "verified"       ? "#dbeafe" :
      status === "in_progress"    ? "#fef3c7" :
      status === "volunteer_done" ? "#d1fae5" :
      status === "completed"      ? "#e0e7ff" : "#f3f4f6",
    color:
      status === "verified"       ? "#1d4ed8" :
      status === "in_progress"    ? "#b45309" :
      status === "volunteer_done" ? "#065f46" :
      status === "completed"      ? "#4338ca" : "#6b7280",
  }),
  btnPrimary: {
    background: "#c0392b", color: "#fff", border: "none",
    borderRadius: "8px", padding: "12px 24px", fontWeight: 700,
    fontSize: "14px", cursor: "pointer", width: "100%",
  },
  btnSecondary: {
    background: "#16a34a", color: "#fff", border: "none",
    borderRadius: "8px", padding: "12px 24px", fontWeight: 700,
    fontSize: "14px", cursor: "pointer", width: "100%",
  },
  btnDisabled: {
    background: "#e5e7eb", color: "#9ca3af", border: "none",
    borderRadius: "8px", padding: "12px 24px", fontWeight: 700,
    fontSize: "14px", cursor: "not-allowed", width: "100%",
  },
  bubble: (from) => ({
    display: "flex", flexDirection: "column",
    alignItems: from === "volunteer" ? "flex-end" : "flex-start",
    marginBottom: "12px",
  }),
  bubbleInner: (from) => ({
    maxWidth: "80%", padding: "10px 14px", borderRadius:
      from === "volunteer" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
    background: from === "volunteer" ? "#c0392b" : "#f0ece4",
    color: from === "volunteer" ? "#fff" : "#1a1a1a",
    fontSize: "14px", lineHeight: "1.5",
  }),
  bubbleMeta: { fontSize: "11px", color: "#aaa", marginTop: "4px" },
  textarea: {
    width: "100%", border: "1px solid #e8e4dc", borderRadius: "8px",
    padding: "10px 14px", fontSize: "14px", resize: "vertical",
    fontFamily: "inherit", boxSizing: "border-box", minHeight: "80px",
  },
  sendBtn: {
    background: "#c0392b", color: "#fff", border: "none",
    borderRadius: "8px", padding: "10px 20px", fontWeight: 700,
    fontSize: "14px", cursor: "pointer", marginTop: "10px",
    alignSelf: "flex-end",
  },
  alert: {
    background: "#fef3c7", border: "1px solid #fde68a",
    borderRadius: "8px", padding: "12px 16px", fontSize: "14px",
    color: "#92400e", marginBottom: "16px",
  },
  success: {
    background: "#d1fae5", border: "1px solid #6ee7b7",
    borderRadius: "8px", padding: "12px 16px", fontSize: "14px",
    color: "#065f46", marginBottom: "16px",
  },
  debugBox: {
    background: "#f0f4ff", border: "1px solid #c7d2fe",
    borderRadius: "8px", padding: "10px 14px", fontSize: "12px",
    color: "#3730a3", marginBottom: "16px", fontFamily: "monospace",
  },
};

const VolunteerAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // ── FIXED: Read from BOTH localStorage and sessionStorage ──────────
  // The volunteer dashboard stores user in localStorage under "user",
  // but the notification bell reads from sessionStorage "email".
  // We need to support both.
  const getVolunteerEmail = () => {
    // Try localStorage first (set during volunteer login)
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.email) return storedUser.email;
    // Fallback to sessionStorage (set during regular login)
    return sessionStorage.getItem("email") || "";
  };

  const getVolunteerName = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.name || storedUser.fullName || "Volunteer";
  };

  const volunteerEmail = getVolunteerEmail();
  const volunteerName  = getVolunteerName();

  const [req, setReq]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [inquiry, setInquiry]   = useState("");
  const [sending, setSending]   = useState(false);
  const [working, setWorking]   = useState(false);
  const [marking, setMarking]   = useState(false);
  const [flash, setFlash]       = useState(null); // { type: "success"|"error", msg }
  const chatEndRef              = useRef(null);

  const fetchRequest = async () => {
    try {
      const res = await axios.get(`${BASE}/api/requests/${id}`);
      setReq(res.data);
    } catch {
      setFlash({ type: "error", msg: "Could not load request details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();

    // Socket: listen for admin replies
    if (volunteerEmail) {
      socketRef.current = io(BASE, { transports: ["websocket", "polling"] });
      socketRef.current.on("connect", () => {
        socketRef.current.emit("join", volunteerEmail);
      });
      // Refresh when admin replies
      socketRef.current.on("alert", () => fetchRequest());
    }
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [id]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [req?.inquiries]);

  const handleStartWork = async () => {
    setWorking(true);
    try {
      const res = await axios.put(`${BASE}/api/requests/${id}/start-work`, {
        volunteerEmail,
      });
      setReq(res.data);
      setFlash({ type: "success", msg: "✅ You are now marked as working on this request. Admin has been notified." });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status. Please try again.";
      setFlash({ type: "error", msg });
    } finally {
      setWorking(false);
    }
  };

  const handleMarkDone = async () => {
    if (!window.confirm("Mark this request as done? Admin will be notified to review and close it.")) return;
    setMarking(true);
    try {
      const res = await axios.put(`${BASE}/api/requests/${id}/volunteer-done`, {
        volunteerEmail,
      });
      setReq(res.data);
      setFlash({ type: "success", msg: "🎉 Great work! Admin has been notified to close this request." });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to mark as done. Please try again.";
      setFlash({ type: "error", msg });
    } finally {
      setMarking(false);
    }
  };

  const handleSendInquiry = async () => {
    if (!inquiry.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${BASE}/api/requests/${id}/inquiry`, {
        message: inquiry.trim(),
        volunteerEmail,
        volunteerName,
      });
      setReq(res.data);
      setInquiry("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send message. Please try again.";
      setFlash({ type: "error", msg });
    } finally {
      setSending(false);
    }
  };

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1)    return "just now";
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "#aaa" }}>Loading assignment...</div>;
  if (!req)    return <div style={{ padding: "60px", textAlign: "center", color: "#aaa" }}>Request not found.</div>;

  const assignedEmail = req.assignedVolunteer?.email?.trim().toLowerCase();
  const myEmail       = volunteerEmail?.trim().toLowerCase();
  const isAssigned    = assignedEmail && myEmail && assignedEmail === myEmail;
  const status        = req.status;

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <button style={s.back} onClick={() => navigate("/volunteer-dashboard")}>
          ← Back to Dashboard
        </button>

        {/* Flash message */}
        {flash && (
          <div style={flash.type === "success" ? s.success : s.alert}>
            {flash.msg}
            <button
              onClick={() => setFlash(null)}
              style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >✕</button>
          </div>
        )}

        {/* Assignment mismatch warning */}
        {!isAssigned && status !== "completed" && (
          <div style={s.alert}>
            ⚠️ You are viewing this request but are not the assigned volunteer.
            Actions and messaging are only available to the assigned volunteer.
            <br />
            <small style={{ opacity: 0.7 }}>
              Assigned: {req.assignedVolunteer?.email || "None"} · Your email: {volunteerEmail || "Not detected"}
            </small>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#1a1a1a" }}>
            {req.district}{req.fullAddress ? `, ${req.fullAddress}` : ""}
          </h1>
          <span style={s.statusBadge(status)}>
            {status === "in_progress"    ? "🛠️ In Progress" :
             status === "volunteer_done" ? "✅ Done — Awaiting Admin Review" :
             status === "completed"      ? "🏁 Completed" :
             status === "verified"       ? "🔵 Assigned to You" : status}
          </span>
        </div>

        {/* Request Details */}
        <div style={s.card}>
          <h2 style={s.h2}>📋 Request Details</h2>
          {[
            ["Aid Needed",       req.aidTypes?.join(" + ") || "—"],
            ["People Affected",  req.peopleAffected],
            ["Priority",         req.priority || "—"],
            ["Submitted by",     req.fullName],
            ["Phone",            req.phoneNumber],
            ["District",         req.district],
            ["Full Address",     req.fullAddress || "—"],
            ["Submitted",        new Date(req.createdAt).toLocaleString()],
            ["Assigned Volunteer", req.assignedVolunteer?.name || "—"],
          ].map(([label, value]) => (
            <div key={label} style={s.row}>
              <span style={s.label}>{label}</span>
              <span style={s.value}>{value}</span>
            </div>
          ))}
          {req.additionalDetails && (
            <div style={{ marginTop: "16px", padding: "14px", background: "#f9f7f4", borderRadius: "8px" }}>
              <p style={{ margin: 0, color: "#555", fontStyle: "italic", fontSize: "14px", lineHeight: "1.7" }}>
                "{req.additionalDetails}"
              </p>
            </div>
          )}
        </div>

        {/* ── ACTIONS: only if this volunteer is assigned and request is active ── */}
        {isAssigned && status !== "completed" && (
          <div style={s.card}>
            <h2 style={s.h2}>⚡ Actions</h2>

            {status === "verified" && (
              <div>
                <p style={{ color: "#555", fontSize: "14px", marginBottom: "16px" }}>
                  You have been assigned to this request. Tap below when you begin working on it — admin will be notified.
                </p>
                <button
                  style={working ? s.btnDisabled : s.btnPrimary}
                  onClick={handleStartWork}
                  disabled={working}
                >
                  {working ? "Updating..." : "🛠️ Mark as Working"}
                </button>
              </div>
            )}

            {status === "in_progress" && (
              <div>
                <p style={{ color: "#555", fontSize: "14px", marginBottom: "16px" }}>
                  You are currently working on this request. Once you have completed all tasks, mark it as done below.
                </p>
                <button
                  style={marking ? s.btnDisabled : s.btnSecondary}
                  onClick={handleMarkDone}
                  disabled={marking}
                >
                  {marking ? "Submitting..." : "✅ Mark as Done"}
                </button>
              </div>
            )}

            {status === "volunteer_done" && (
              <p style={{ color: "#065f46", fontSize: "14px", fontWeight: 600 }}>
                ✅ You marked this as done. Waiting for admin to review and officially close the request.
              </p>
            )}
          </div>
        )}

        {/* ── MESSAGING: only if assigned and not completed ── */}
        {isAssigned && status !== "completed" && (
          <div style={s.card}>
            <h2 style={s.h2}>💬 Messages with Admin</h2>

            {/* Chat thread */}
            <div style={{
              maxHeight: "360px", overflowY: "auto",
              marginBottom: "20px", paddingRight: "4px",
            }}>
              {(!req.inquiries || req.inquiries.length === 0) ? (
                <p style={{ color: "#aaa", fontSize: "14px" }}>
                  No messages yet. Use this to ask admin anything about this request.
                </p>
              ) : (
                req.inquiries.map((msg, i) => (
                  <div key={i} style={s.bubble(msg.from)}>
                    <div style={s.bubbleInner(msg.from)}>{msg.message}</div>
                    <span style={s.bubbleMeta}>
                      {msg.from === "volunteer" ? "You" : "Admin"} · {timeAgo(msg.sentAt)}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Send new message */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <textarea
                style={s.textarea}
                placeholder="Type your message or inquiry here..."
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleSendInquiry();
                }}
              />
              <span style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                Ctrl+Enter to send
              </span>
              <button
                style={sending || !inquiry.trim()
                  ? { ...s.sendBtn, opacity: 0.5, cursor: "not-allowed" }
                  : s.sendBtn}
                onClick={handleSendInquiry}
                disabled={sending || !inquiry.trim()}
              >
                {sending ? "Sending..." : "Send Message →"}
              </button>
            </div>
          </div>
        )}

        {/* Completed state */}
        {status === "completed" && (
          <div style={{ ...s.card, textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏁</div>
            <h2 style={{ color: "#065f46", margin: "0 0 8px 0" }}>Request Completed</h2>
            <p style={{ color: "#555", margin: "0 0 20px 0" }}>
              This request has been officially closed by admin on{" "}
              {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : "—"}.
              Thank you for your service!
            </p>
            {/* Show chat history even for completed requests */}
            {req.inquiries?.length > 0 && (
              <div style={{ textAlign: "left", marginTop: "24px" }}>
                <h3 style={{ fontSize: "16px", color: "#555", marginBottom: "12px" }}>
                  💬 Message History
                </h3>
                {req.inquiries.map((msg, i) => (
                  <div key={i} style={s.bubble(msg.from)}>
                    <div style={s.bubbleInner(msg.from)}>{msg.message}</div>
                    <span style={s.bubbleMeta}>
                      {msg.from === "volunteer" ? req.assignedVolunteer?.name || "Volunteer" : "Admin"} · {timeAgo(msg.sentAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerAssignment;
