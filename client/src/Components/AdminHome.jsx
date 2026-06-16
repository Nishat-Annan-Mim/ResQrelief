import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import "./AdminHome.css";

const AdminHome = () => {
  const [topItems, setTopItems] = useState([]);
  const [topRequests, setTopRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load top 5 inventory
    axios
      .get("https://resqrelief-fj7z.onrender.com/api/inventory")
      .then((res) => {
        setTopItems(res.data.slice(0, 5));
      });

    // Load AI prioritized requests
    axios
      .get("https://resqrelief-fj7z.onrender.com/api/requests/ai-prioritized")
      .then((res) => {
        setTopRequests(res.data.slice(0, 5));
        setLoadingRequests(false);
      })
      .catch(() => setLoadingRequests(false));
  }, []);

  const getStatusClass = (status) => {
    if (status === "OK") return "status-ok";
    if (status === "Low") return "status-low";
    return "status-error";
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
    <AdminLayout>
      <div className="ah-main">
        {/* INVENTORY SECTION */}
        <section className="ah-section">
          <div className="ah-section-header">
            <h2 className="ah-section-title">Inventory Overview (Top 5)</h2>
            <button onClick={() => navigate("/inventory")} className="ah-show-all-btn">
              Show All
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </svg>
            </button>
          </div>

          <div className="ah-table-wrap">
            <table className="ah-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
                  <tr key={item._id}>
                    <td className="ah-td-bold">{item.itemName}</td>
                    <td className="ah-td-muted">{item.category}</td>
                    <td className="ah-td-mono">{item.quantity}</td>
                    <td>
                      <span className={`ah-status-pill ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI PRIORITIZED REQUESTS SECTION */}
        <section className="ah-section">
          <div className="ah-section-header">
            <div className="ah-section-title-group">
              <h2 className="ah-section-title">AI-Prioritized Requests (Top 5)</h2>
              <span className="ah-ai-badge">AI Assisted</span>
            </div>
            <button onClick={() => navigate("/admin-requests")} className="ah-show-all-btn">
              Show All
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </svg>
            </button>
          </div>

          {loadingRequests ? (
            <p className="ah-loading-text">Analyzing requests with AI...</p>
          ) : (
            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Aid Type</th>
                    <th className="ah-th-center">Priority</th>
                    <th>People</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {topRequests.map((req) => (
                    <tr
                      key={req._id}
                      className="ah-tr-clickable"
                      onClick={() =>
                        navigate(`/admin-requests/${req._id}`, { state: { req } })
                      }
                    >
                      <td className="ah-td-bold">{req.district}</td>
                      <td className="ah-td-muted">{req.aidTypes?.join(" + ") || "—"}</td>
                      <td className="ah-td-center">
                        <span className={`ah-priority-label ${getPriorityClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="ah-td-mono">{req.peopleAffected}</td>
                      <td>
                        <span
                          className={`ah-req-status ${
                            req.status === "pending"
                              ? "ah-req-pending"
                              : req.status === "verified"
                              ? "ah-req-verified"
                              : "ah-req-other"
                          }`}
                        >
                          <span className="ah-status-dot" />
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="ah-td-time">{timeAgo(req.createdAt)}</td>
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

export default AdminHome;
