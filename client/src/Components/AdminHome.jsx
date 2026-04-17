import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminHome.css";

const AdminHome = () => {
  const [topItems, setTopItems] = useState([]);
  const [topRequests, setTopRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load top 5 inventory
    axios.get("http://localhost:3001/api/inventory").then((res) => {
      setTopItems(res.data.slice(0, 5));
    });

    // Load AI prioritized requests
    axios
      .get("http://localhost:3001/api/requests/ai-prioritized")
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
    <div className="admin-dashboard-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <ul className="sidebar-nav">
          <li className="sidebar-item active">Dashboard</li>

          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-requests")}
          >
            Requests
          </li>
          <li className="sidebar-item" onClick={() => navigate("/inventory")}>
            Inventory
          </li>
          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-volunteers")}
          >
            Volunteers
          </li>
          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-operations")}
          >
            Relief Operations
          </li>
          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-alerts")}
          >
            Alerts
          </li>

          <li className="sidebar-item" onClick={() => navigate("/admin-tasks")}>
            Task Management
          </li>
          <li className="sidebar-item" onClick={() => navigate("/collaboration-portal")}>
            NGO Collaboration
          </li>
          
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main-content">
        {/* TOP HALF — Inventory */}
        <div className="admin-top-half">
          <div className="inv-card" style={{ height: "100%" }}>
            <div className="admin-header">
              <h2> Inventory Overview (Top 5)</h2>
              <button
                onClick={() => navigate("/inventory")}
                className="btn-admin"
              >
                Show All →
              </button>
            </div>
            <table className="inv-table">
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
                    <td>{item.itemName}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <span
                        className={`status-pill ${getStatusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM HALF — AI Prioritized Requests */}
        <div
          className="admin-bottom-half"
          style={{ display: "block", padding: "25px" }}
        >
          <div className="admin-header">
            <h2> AI-Prioritized Requests (Top 5)</h2>
            <button
              onClick={() => navigate("/admin-requests")}
              className="btn-admin"
            >
              Show All →
            </button>
          </div>

          {loadingRequests ? (
            <p style={{ color: "#aaa" }}>Analyzing requests with AI...</p>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Aid Type</th>
                  <th>Priority</th>
                  <th>People</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {topRequests.map((req) => (
                  <tr
                    key={req._id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/admin-requests/${req._id}`, { state: { req } })
                    }
                  >
                    <td>{req.district}</td>
                    <td>{req.aidTypes?.join(" + ") || "—"}</td>
                    <td>
                      <span
                        className={`priority-label ${getPriorityClass(req.priority)}`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td>{req.peopleAffected}</td>
                    <td
                      style={{
                        textTransform: "capitalize", // capitalize first letter
                        fontWeight: 600, // make it bold
                        color:
                          req.status === "pending"
                            ? "#c0392b" // red for pending
                            : req.status === "verified"
                              ? "#16a34a" // green for verified
                              : "#888", // gray for other statuses
                      }}
                    >
                      {req.status}
                    </td>
                    <td>{timeAgo(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminHome;
