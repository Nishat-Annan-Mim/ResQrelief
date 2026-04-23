import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./VolunteerOperations.css";

const STATUS_FLOW = ["Pending", "On the way", "Arrived", "Completed"];

const VolunteerOperations = () => {
  const navigate = useNavigate();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user?.email) {
      axios
        .get(
          `https://resqreliefcheck.onrender.com/api/operations/volunteer/${user.email}`,
        )
        .then((res) => {
          setOperations(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const updateStatus = async (id, currentStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    await axios.put(
      `https://resqreliefcheck.onrender.com/api/operations/${id}/status`,
      {
        status: nextStatus,
      },
    );
    setOperations((prev) =>
      prev.map((op) => (op._id === id ? { ...op, status: nextStatus } : op)),
    );
  };

  const openRouteMap = (op) => {
    const locationNames =
      op.locations?.map((l) => encodeURIComponent(l.name)).join(",") || "";
    const opName = encodeURIComponent(op.operationName);
    const opId = op._id;
    const volunteerEmail = encodeURIComponent(user?.email || "");
    const url = `https://resqreliefcheck.onrender.com/routemap.html?locations=${locationNames}&op=${opName}&opId=${opId}&email=${volunteerEmail}`;
    window.open(url, "_blank");
  };

  const getStatusColor = (status) => {
    if (status === "Completed") return { bg: "#d8f3dc", color: "#2d6a4f" };
    if (status === "On the way") return { bg: "#fff3cd", color: "#d97706" };
    if (status === "Arrived") return { bg: "#cce5ff", color: "#0077b6" };
    return { bg: "#fce4e4", color: "#c0392b" };
  };

  const active = operations.filter((o) => o.status !== "Completed");
  const history = operations.filter((o) => o.status === "Completed");

  if (loading)
    return <div className="vo-loading">Loading your operations...</div>;

  return (
    <div className="vo-page">
      <button
        className="vo-back-btn"
        onClick={() => navigate("/volunteer-dashboard")}
      >
        ← Back to Dashboard
      </button>

      <h1 className="vo-page-title">🚛 My Relief Operations</h1>
      <p className="vo-page-subtitle">
        View your assigned operations and update their status in real-time.
      </p>

      {/* ── ACTIVE OPERATIONS ── */}
      <h2 className="vo-section-heading">
        📋 Active Operations ({active.length})
      </h2>

      {active.length === 0 && (
        <div className="vo-empty-box">
          No active operations assigned to you yet.
        </div>
      )}

      {active.map((op) => {
        const sc = getStatusColor(op.status);
        const currentIndex = STATUS_FLOW.indexOf(op.status);
        const nextStatus = STATUS_FLOW[currentIndex + 1];
        const teammates = op.volunteers?.filter(
          (v) => v.volunteerEmail !== user?.email,
        );

        return (
          <div key={op._id} className="vo-op-card">
            {/* Header Row */}
            <div className="vo-card-header">
              <div>
                <h3 className="vo-card-title">{op.operationName}</h3>
                <p className="vo-card-meta">
                  📅 {op.scheduledDate || "Date not set"}{" "}
                  {op.departureTime ? `— Departs at ${op.departureTime}` : ""}
                </p>
              </div>
              <span
                className="vo-status-badge"
                style={{ background: sc.bg, color: sc.color }}
              >
                {op.status}
              </span>
            </div>

            {/* ── TEAMMATES ── */}
            {teammates?.length > 0 && (
              <div className="vo-teammates-box">
                <p className="vo-teammates-label">
                  👥 Team Members on This Operation
                </p>
                {teammates.map((t, i) => (
                  <p key={i} className="vo-teammate-name">
                    👤 {t.volunteerName}
                  </p>
                ))}
              </div>
            )}

            {/* ── SUPPLY COLLECTION POINT ── */}
            {op.supplyPickupPoint && (
              <div className="vo-pickup-box">
                <span className="vo-pickup-icon">📦</span>
                <div>
                  <p className="vo-pickup-label">Supply Collection Point</p>
                  <p className="vo-pickup-value">{op.supplyPickupPoint}</p>
                  <p className="vo-pickup-hint">
                    Please collect all assigned supplies from this location
                    before departing.
                  </p>
                </div>
              </div>
            )}

            {/* ── LOCATIONS + SUPPLIES PER LOCATION ── */}
            <div className="vo-destinations-section">
              <p className="vo-label-style">📍 Destinations & Supplies</p>
              {op.locations?.length > 0 ? (
                op.locations.map((loc, i) => (
                  <div key={i} className="vo-location-card">
                    <p className="vo-location-name">📍 {loc.name}</p>
                    {loc.supplies?.length > 0 ? (
                      <div className="vo-supplies-row">
                        {loc.supplies.map((s, j) => (
                          <span key={j} className="vo-supply-chip">
                            📦 {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="vo-no-supplies">No supplies assigned</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="vo-no-locations">No locations assigned</p>
              )}
            </div>

            {/* ── ADMIN NOTES ── */}
            {op.notes && (
              <div className="vo-notes-box">
                <p className="vo-label-style">📝 Admin Notes</p>
                <p className="vo-notes-text">{op.notes}</p>
              </div>
            )}

            {/* ── BUTTONS ROW ── */}
            <div className="vo-action-row">
              <button className="vo-route-btn" onClick={() => openRouteMap(op)}>
                🗺️ View Route Map
              </button>

              {nextStatus && (
                <button
                  className="vo-status-btn"
                  onClick={() => updateStatus(op._id, op.status)}
                >
                  Mark as: {nextStatus} →
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ── TASK HISTORY ── */}
      <h2 className="vo-section-heading-history">
        🗂️ Task History ({history.length})
      </h2>

      {history.length === 0 && (
        <div className="vo-empty-box-history">No completed operations yet.</div>
      )}

      {history.map((op) => (
        <div key={op._id} className="vo-history-card">
          <div className="vo-history-card-header">
            <div>
              <h3 className="vo-history-title">{op.operationName}</h3>
              <p className="vo-history-meta">
                📅 {op.scheduledDate || "—"}{" "}
                {op.departureTime ? `— Departed at ${op.departureTime}` : ""}{" "}
                &nbsp;|&nbsp; 📍{" "}
                {op.locations?.map((l) => l.name).join(", ") || "—"}
              </p>
              {op.volunteers?.length > 1 && (
                <p className="vo-history-team">
                  👥 Team:{" "}
                  {op.volunteers.map((v) => v.volunteerName).join(", ")}
                </p>
              )}
            </div>
            <span className="vo-completed-badge">✅ Completed</span>
          </div>

          {op.supplyPickupPoint && (
            <div className="vo-history-pickup-box">
              <span className="vo-history-pickup-icon">📦</span>
              <div>
                <p className="vo-history-pickup-label">
                  Supply Collection Point
                </p>
                <p className="vo-history-pickup-value">
                  {op.supplyPickupPoint}
                </p>
              </div>
            </div>
          )}

          <div className="vo-history-locations">
            {op.locations?.map((loc, i) => (
              <p key={i} className="vo-history-location-row">
                <strong>📍 {loc.name}:</strong>{" "}
                {loc.supplies?.length > 0
                  ? loc.supplies.join(", ")
                  : "No supplies"}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VolunteerOperations;
