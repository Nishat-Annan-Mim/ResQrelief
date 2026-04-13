import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const STATUS_FLOW = ["Pending", "On the way", "Arrived", "Completed"];

const VolunteerOperations = () => {
  const navigate = useNavigate();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user?.email) {
      axios
        .get(`http://localhost:3001/api/operations/volunteer/${user.email}`)
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
    await axios.put(`http://localhost:3001/api/operations/${id}/status`, {
      status: nextStatus,
    });
    setOperations((prev) =>
      prev.map((op) => (op._id === id ? { ...op, status: nextStatus } : op)),
    );
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
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading your operations...
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "30px 20px",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <button
        onClick={() => navigate("/volunteer-dashboard")}
        style={{
          background: "none",
          border: "none",
          color: "#1a1a2e",
          fontSize: "14px",
          cursor: "pointer",
          marginBottom: "16px",
          fontWeight: 600,
        }}
      >
        ← Back to Dashboard
      </button>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "#1a1a2e",
          marginBottom: "6px",
        }}
      >
        🚛 My Relief Operations
      </h1>
      <p style={{ color: "#666", marginBottom: "28px" }}>
        View your assigned operations and update their status in real-time.
      </p>

      {/* ── ACTIVE OPERATIONS ── */}
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 700,
          marginBottom: "14px",
          color: "#1a1a2e",
        }}
      >
        📋 Active Operations ({active.length})
      </h2>

      {active.length === 0 && (
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
            color: "#888",
            marginBottom: "28px",
          }}
        >
          No active operations assigned to you yet.
        </div>
      )}

      {active.map((op) => {
        const sc = getStatusColor(op.status);
        const currentIndex = STATUS_FLOW.indexOf(op.status);
        const nextStatus = STATUS_FLOW[currentIndex + 1];

        // Other volunteers in this same operation (excluding current user)
        const teammates = op.volunteers?.filter(
          (v) => v.volunteerEmail !== user?.email,
        );

        return (
          <div
            key={op._id}
            style={{
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "14px",
              padding: "22px",
              marginBottom: "18px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#1a1a2e" }}>
                  {op.operationName}
                </h3>
                <p
                  style={{ margin: "4px 0 0", fontSize: "13px", color: "#888" }}
                >
                  📅 {op.scheduledDate || "Date not set"}{" "}
                  {op.departureTime ? `— Departs at ${op.departureTime}` : ""}
                </p>
              </div>
              <span
                style={{
                  background: sc.bg,
                  color: sc.color,
                  padding: "5px 14px",
                  borderRadius: "20px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {op.status}
              </span>
            </div>

            {/* ── TEAMMATES ── */}
            {teammates?.length > 0 && (
              <div
                style={{
                  marginTop: "14px",
                  background: "#f0f4ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "8px",
                  padding: "10px 14px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#3730a3",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  👥 Team Members on This Operation
                </p>
                {teammates.map((t, i) => (
                  <p
                    key={i}
                    style={{
                      margin: "3px 0",
                      fontSize: "13px",
                      color: "#4338ca",
                      fontWeight: 600,
                    }}
                  >
                    👤 {t.volunteerName}
                  </p>
                ))}
              </div>
            )}

            {/* ── SUPPLY COLLECTION POINT ── */}
            {op.supplyPickupPoint && (
              <div
                style={{
                  marginTop: "16px",
                  background: "#fff8e1",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "20px" }}>📦</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#92400e",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Supply Collection Point
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#78350f",
                    }}
                  >
                    {op.supplyPickupPoint}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#92400e",
                    }}
                  >
                    Please collect all assigned supplies from this location
                    before departing.
                  </p>
                </div>
              </div>
            )}

            {/* ── LOCATIONS + SUPPLIES PER LOCATION ── */}
            <div style={{ marginTop: "18px" }}>
              <p style={labelStyle}>📍 Destinations & Supplies</p>
              {op.locations?.length > 0 ? (
                op.locations.map((loc, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f9f6f0",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginTop: "10px",
                      borderLeft: "3px solid #1a1a2e",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#1a1a2e",
                      }}
                    >
                      📍 {loc.name}
                    </p>
                    {loc.supplies?.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {loc.supplies.map((s, j) => (
                          <span
                            key={j}
                            style={{
                              background: "#e8e3db",
                              color: "#444",
                              padding: "3px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            📦 {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: "13px", color: "#aaa" }}>
                        No supplies assigned
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p
                  style={{ margin: "8px 0 0", fontSize: "13px", color: "#aaa" }}
                >
                  No locations assigned
                </p>
              )}
            </div>

            {/* ── ADMIN NOTES ── */}
            {op.notes && (
              <div
                style={{
                  marginTop: "14px",
                  background: "#f9f6f0",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <p style={labelStyle}>📝 Admin Notes</p>
                <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                  {op.notes}
                </p>
              </div>
            )}

            {/* ── STATUS UPDATE BUTTON ── */}
            {nextStatus && (
              <button
                onClick={() => updateStatus(op._id, op.status)}
                style={{
                  marginTop: "18px",
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #1a1a2e, #e63946)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mark as: {nextStatus} →
              </button>
            )}
          </div>
        );
      })}

      {/* ── TASK HISTORY ── */}
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 700,
          margin: "32px 0 14px",
          color: "#1a1a2e",
        }}
      >
        🗂️ Task History ({history.length})
      </h2>

      {history.length === 0 && (
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
            color: "#888",
          }}
        >
          No completed operations yet.
        </div>
      )}

      {history.map((op) => (
        <div
          key={op._id}
          style={{
            background: "#f9f9f9",
            border: "1px solid #e8e8e8",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "14px",
            opacity: 0.85,
          }}
        >
          {/* History Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                {op.operationName}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#888" }}>
                📅 {op.scheduledDate || "—"}{" "}
                {op.departureTime ? `— Departed at ${op.departureTime}` : ""}{" "}
                &nbsp;|&nbsp; 📍{" "}
                {op.locations?.map((l) => l.name).join(", ") || "—"}
              </p>
              {/* Team in history */}
              {op.volunteers?.length > 1 && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#4338ca",
                  }}
                >
                  👥 Team:{" "}
                  {op.volunteers.map((v) => v.volunteerName).join(", ")}
                </p>
              )}
            </div>
            <span
              style={{
                background: "#d8f3dc",
                color: "#2d6a4f",
                padding: "4px 12px",
                borderRadius: "20px",
                fontWeight: 700,
                fontSize: "13px",
                height: "fit-content",
              }}
            >
              ✅ Completed
            </span>
          </div>

          {/* Supply Collection Point in history */}
          {op.supplyPickupPoint && (
            <div
              style={{
                marginTop: "12px",
                background: "#fff8e1",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "16px" }}>📦</span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#92400e",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Supply Collection Point
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#78350f",
                  }}
                >
                  {op.supplyPickupPoint}
                </p>
              </div>
            </div>
          )}

          {/* Locations + supplies summary */}
          <div style={{ marginTop: "10px" }}>
            {op.locations?.map((loc, i) => (
              <p
                key={i}
                style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}
              >
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

const labelStyle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export default VolunteerOperations;
