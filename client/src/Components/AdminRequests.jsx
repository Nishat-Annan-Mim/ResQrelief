import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminHome.css";

const TABS = [
  { label: "🤖 AI Prioritized", value: "all" },
  { label: "✅ Verified", value: "verified" },
  { label: "⏳ Pending", value: "pending" },
  { label: "🚫 Fraud / Banned", value: "fraud" },
];

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [banned, setBanned] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (priority === "HIGH") return "priority-high";
    if (priority === "MEDIUM") return "priority-medium";
    return "priority-low";
  };

  const timeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

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
          <div className="ar-tabs">
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
          ) : requests.length === 0 ? (
            <p style={{ color: "#aaa", padding: "20px 0" }}>No requests found.</p>
          ) : (
            /* REQUESTS TABLE */
            <table className="inv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Aid Type</th>
                  <th>Priority</th>
                  <th>People</th>
                  <th>Status</th>
                  {activeTab === "verified" && <th>Assigned To</th>}
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr
                    key={req._id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/admin-requests/${req._id}`, { state: { req } })
                    }
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
                    <td
                      style={{
                        textTransform: "capitalize",
                        fontWeight: 600,
                        color:
                          req.status === "pending"
                            ? "#c0392b"
                            : req.status === "verified"
                            ? "#16a34a"
                            : "#888",
                      }}
                    >
                      {req.status}
                    </td>
                    {activeTab === "verified" && (
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
