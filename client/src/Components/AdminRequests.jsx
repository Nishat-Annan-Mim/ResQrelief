import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, CircleCheck, Hourglass, Ban } from "lucide-react";
import "./AdminHome.css";
import AdminLayout from "./AdminLayout";

const TABS = [
  { label: "AI Prioritized",  value: "all",      icon: Sparkles },
  { label: "Verified",        value: "verified", icon: CircleCheck },
  { label: "Pending",         value: "pending",  icon: Hourglass },
  { label: "Fraud / Banned",  value: "fraud",    icon: Ban },
];

const AdminRequests = () => {
  const [requests, setRequests]   = useState([]);
  const [banned, setBanned]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const location                  = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "all");
  const navigate                  = useNavigate();

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === "all") {
        const res = await axios.get(
          "https://resqrelief-fj7z.onrender.com/api/requests/ai-prioritized"
        );
        setRequests(res.data);
      } else if (tab === "fraud") {
        const res = await axios.get(
          "https://resqrelief-fj7z.onrender.com/api/banned"
        );
        setBanned(res.data);
        setRequests([]);
      } else {
        const res = await axios.get(
          `https://resqrelief-fj7z.onrender.com/api/requests/by-status/${tab}`
        );
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

  const getReqStatusClass = (status) => {
    if (status === "verified")       return "ah-req-verified";
    if (status === "pending")        return "ah-req-pending";
    if (status === "volunteer_done") return "ah-req-verified";
    if (status === "completed")      return "ah-req-verified";
    if (status === "in_progress")    return "ah-req-other";
    return "ah-req-other";
  };

  const timeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 60000);
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this request? This cannot be undone.")) return;
    try {
      await axios.delete(
        `https://resqrelief-fj7z.onrender.com/api/requests/${id}/remove`
      );
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert("Failed to delete request.");
    }
  };

  const statusLabel = (s) => {
    if (s === "in_progress")    return "In Progress";
    if (s === "volunteer_done") return "Vol. Done";
    if (s === "completed")      return "Completed";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <AdminLayout>
      <div className="ah-main">

        {/* ── Request Portal Section ── */}
        <section className="ah-section">
          <div className="ah-section-header">
            <div className="ah-section-title-group">
              <h2 className="ah-section-title">Request Portal</h2>
              {activeTab === "all" && (
                <span className="ah-ai-badge">AI Assisted</span>
              )}
            </div>
            <button
              className="ah-show-all-btn"
              onClick={() => navigate("/admin-home")}
            >
              Dashboard
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </svg>
            </button>
          </div>

          {/* ── Tabs ── */}
          <div
            className="ar-tabs"
            style={{
              padding: "16px 24px 0",
              borderBottom: "1px solid var(--ad-border)",
              marginBottom: 0,
            }}
          >
            {TABS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                className={`ar-tab ${activeTab === value ? "ar-tab-active" : ""}`}
                onClick={() => setActiveTab(value)}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <p className="ah-loading-text">
              {activeTab === "all" ? "Analyzing requests with AI…" : "Loading…"}
            </p>

          ) : activeTab === "fraud" ? (
            banned.length === 0 ? (
              <p className="ah-loading-text">No banned entries yet.</p>
            ) : (
              <div className="ah-table-wrap">
                <table className="ah-table ad-stack">
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
                        <td className="ah-td-bold" style={{ color: "#c53030" }} data-label="Phone (Banned)">
                          {b.phone}
                        </td>
                        <td className="ah-td-muted" data-label="Submitted By">{b.email}</td>
                        <td data-label="Reason">
                          <span className="ah-priority-label priority-high">
                            {b.reason?.toUpperCase()}
                          </span>
                        </td>
                        <td className="ah-td-time" data-label="Banned At">{timeAgo(b.bannedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          ) : requests.length === 0 ? (
            <p className="ah-loading-text">No requests found.</p>

          ) : (
            <div className="ah-table-wrap">
              <table className="ah-table ad-stack">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location</th>
                    <th>Aid Type</th>
                    <th className="ah-th-center">Priority</th>
                    <th>People</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="ah-th-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, index) => (
                    <tr
                      key={req._id}
                      className="ah-tr-clickable"
                      onClick={() =>
                        navigate(`/admin-requests/${req._id}`, { state: { req } })
                      }
                    >
                      <td className="ah-td-mono" data-label="ID">#{1000 + index}</td>
                      <td className="ah-td-bold" data-label="Location">
                        {req.district}
                        {req.fullAddress && (
                          <span className="ah-td-muted">, {req.fullAddress}</span>
                        )}
                      </td>
                      <td className="ah-td-muted" data-label="Aid Type">{req.aidTypes?.join(" + ") || "—"}</td>
                      <td className="ah-td-center" data-label="Priority">
                        <span className={`ah-priority-label ${getPriorityClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="ah-td-mono" data-label="People">{req.peopleAffected}</td>
                      <td data-label="Status">
                        <span className={`ah-req-status ${getReqStatusClass(req.status)}`}>
                          <span className="ah-status-dot" />
                          {statusLabel(req.status)}
                        </span>
                      </td>
                      <td className="ah-td-time" data-label="Submitted">{timeAgo(req.createdAt)}</td>
                      <td
                        className="ah-td-center"
                        data-label="Actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleDelete(e, req._id)}
                          style={{
                            padding: "5px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#c53030",
                            background: "#fff1f1",
                            border: "1.5px solid #fca5a5",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background 0.2s, color 0.2s, border-color 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#c53030";
                            e.currentTarget.style.color = "#fff";
                            e.currentTarget.style.borderColor = "#c53030";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#fff1f1";
                            e.currentTarget.style.color = "#c53030";
                            e.currentTarget.style.borderColor = "#fca5a5";
                          }}
                          title="Delete request"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminRequests;
