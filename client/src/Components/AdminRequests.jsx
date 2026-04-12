import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminHome.css";

const TABS = [
  { label: "🤖 AI Prioritized", value: "all"       },
  { label: "✅ Verified",        value: "verified"  },
  { label: "🛠️ In Progress",    value: "in_progress" },
  { label: "⏳ Pending",         value: "pending"   },
  { label: "🚫 Fraud / Banned",  value: "fraud"     },
  { label: "🏁 Completed",       value: "completed" },
];

const AdminRequests = () => {
  const [requests, setRequests]   = useState([]);
  const [banned, setBanned]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === "all") {
        const res = await axios.get("http://localhost:3001/api/requests/ai-prioritized");
        setRequests(res.data);
      } else if (tab === "fraud") {
        const res = await axios.get("http://localhost:3001/api/banned");
        setBanned(res.data);
        setRequests([]);
      } else {
        // works for: verified, in_progress, pending, completed
        const res = await axios.get(`http://localhost:3001/api/requests/by-status/${tab}`);
        setRequests(res.data);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    if (priority === "HIGH")   return "priority-high";
    if (priority === "MEDIUM") return "priority-medium";
    return "priority-low";
  };

  const timeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 60000);
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const statusColor = (s) =>
    s === "pending"        ? "#c0392b" :
    s === "verified"       ? "#1d4ed8" :
    s === "in_progress"    ? "#b45309" :
    s === "volunteer_done" ? "#16a34a" :
    s === "completed"      ? "#4338ca" : "#888";

  const statusLabel = (s) =>
    s === "in_progress"    ? "In Progress" :
    s === "volunteer_done" ? "Vol. Done"   :
    s === "completed"      ? "Completed"   : s;

  return (
    <div className="admin-dashboard-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <ul className="sidebar-nav">
          <li className="sidebar-item" onClick={() => navigate("/admin-home")}>Dashboard</li>
          <li className="sidebar-item active">Requests</li>
          <li className="sidebar-item" onClick={() => navigate("/inventory")}>Inventory</li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <div className="inv-card">
          <h1 style={{ marginBottom: "20px" }}>Request Portal</h1>

          {/* Tabs */}
          <div className="ar-tabs" style={{ flexWrap: "wrap" }}>
            {TABS.map((tab) => (
              <button
                key={tab.value}
                className={`ar-tab ${activeTab === tab.value ? "ar-tab-active" : ""}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: "#aaa", padding: "20px 0" }}>
              {activeTab === "all" ? "AI is analyzing requests..." : "Loading..."}
            </p>

          ) : activeTab === "fraud" ? (
            /* BANNED TABLE */
            banned.length === 0 ? (
              <p style={{ color: "#aaa", padding: "20px 0" }}>No banned entries yet.</p>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Phone (Banned)</th>
                    <th>Submitted By</th>
                    <th>Reason</th>
                    <th>Banned At</th>
                  </tr>
                </thead>
                <tbody>
                  {banned.map((b) => (
                    <tr key={b._id}>
                      <td style={{ color: "#c0392b", fontWeight: 700 }}>{b.phone}</td>
                      <td>{b.email}</td>
                      <td>
                        <span className="priority-label priority-high">
                          {b.reason?.toUpperCase()}
                        </span>
                      </td>
                      <td>{timeAgo(b.bannedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )

          ) : activeTab === "completed" ? (
            /* COMPLETED TABLE */
            requests.length === 0 ? (
              <p style={{ color: "#aaa", padding: "20px 0" }}>No completed requests yet.</p>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location</th>
                    <th>Aid Type</th>
                    <th>Priority</th>
                    <th>People</th>
                    <th>Handled By</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, index) => (
                    <tr key={req._id} style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/admin-requests/${req._id}`, { state: { req } })}>
                      <td>#{1000 + index}</td>
                      <td>{req.district}{req.fullAddress ? `, ${req.fullAddress}` : ""}</td>
                      <td>{req.aidTypes?.join(" + ") || "—"}</td>
                      <td>
                        <span className={`priority-label ${getPriorityClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td>{req.peopleAffected}</td>
                      <td style={{ color: "#4338ca", fontSize: "13px" }}>
                        {req.assignedVolunteer?.name || "—"}
                      </td>
                      <td style={{ color: "#4338ca", fontWeight: 600, fontSize: "13px" }}>
                        🏁 {req.completedAt ? timeAgo(req.completedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )

          ) : requests.length === 0 ? (
            <p style={{ color: "#aaa", padding: "20px 0" }}>No requests found.</p>
          ) : (
            /* ALL / VERIFIED / IN_PROGRESS / PENDING TABLE */
            <table className="inv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Aid Type</th>
                  <th>Priority</th>
                  <th>People</th>
                  <th>Status</th>
                  {(activeTab === "verified" || activeTab === "in_progress") && <th>Assigned To</th>}
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr
                    key={req._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/admin-requests/${req._id}`, { state: { req } })}
                  >
                    <td>#{1000 + index}</td>
                    <td>{req.district}{req.fullAddress ? `, ${req.fullAddress}` : ""}</td>
                    <td>{req.aidTypes?.join(" + ") || "—"}</td>
                    <td>
                      <span className={`priority-label ${getPriorityClass(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td>{req.peopleAffected}</td>
                    <td style={{ textTransform: "capitalize", fontWeight: 600, color: statusColor(req.status) }}>
                      {req.status === "volunteer_done"
                        ? <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 10px", borderRadius: "999px", fontSize: "12px" }}>
                            Vol. Done ✅
                          </span>
                        : statusLabel(req.status)}
                    </td>
                    {(activeTab === "verified" || activeTab === "in_progress") && (
                      <td style={{ color: "#16a34a", fontSize: "13px" }}>
                        {req.assignedVolunteer?.name || "—"}
                      </td>
                    )}
                    <td>{timeAgo(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-admin" onClick={() => navigate("/admin-home")}>
              Admin Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminRequests;
