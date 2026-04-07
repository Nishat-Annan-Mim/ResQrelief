import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./AdminHome.css";
import "./AdminRequestDetail.css";

const AdminRequestDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [req, setReq] = useState(state?.req || null);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  // volunteer assign state
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVols, setLoadingVols] = useState(false);
  const [selectedVol, setSelectedVol] = useState(null);
  const [showVolPanel, setShowVolPanel] = useState(false);
  const [volSearch, setVolSearch] = useState("");

  // confirm modals
  const [confirmModal, setConfirmModal] = useState(null); // { type: "verify"|"fraud" }

  useEffect(() => {
    if (!req) {
      axios.get(`http://localhost:3001/api/requests`).then((res) => {
        const found = res.data.find((r) => r._id === id);
        setReq(found);
      });
    }
  }, [id, req]);

  // Load volunteers when panel opens
  useEffect(() => {
    if (!showVolPanel || !req) return;
    setLoadingVols(true);
    // Try district match first, fall back to all
    axios
      .get(`http://localhost:3001/api/volunteers/by-district/${req.district}`)
      .then((res) => {
        if (res.data.length > 0) {
          setVolunteers(res.data);
        } else {
          // fallback: all volunteers
          return axios.get("http://localhost:3001/api/volunteers/all").then((r) => {
            setVolunteers(r.data);
          });
        }
      })
      .catch(() =>
        axios.get("http://localhost:3001/api/volunteers/all").then((r) =>
          setVolunteers(r.data)
        )
      )
      .finally(() => setLoadingVols(false));
  }, [showVolPanel, req]);

  const handleVerify = async () => {
    setConfirmModal(null);
    await axios.put(`http://localhost:3001/api/requests/${id}/verify`, {
      assignedVolunteer: selectedVol
        ? {
            name: selectedVol.fullName,
            email: selectedVol.email,
            phone: selectedVol.phone,
          }
        : null,
    });
    setDoneMessage("✅ Request has been verified" + (selectedVol ? ` and assigned to ${selectedVol.fullName}!` : "!"));
    setDone(true);
  };

  const handleFraud = async () => {
    setConfirmModal(null);
    await axios.delete(`http://localhost:3001/api/requests/${id}`);
    setDoneMessage("🚫 Request marked as fraud. Submitter has been banned.");
    setDone(true);
  };

  const filteredVols = volunteers.filter((v) =>
    `${v.fullName} ${v.volunteerRole} ${v.preferredZone}`
      .toLowerCase()
      .includes(volSearch.toLowerCase())
  );

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
                <h3>⚠️ Mark as Fraud?</h3>
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
        {req.district}
        {req.fullAddress ? `, ${req.fullAddress}` : ""}
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
              <h3>✅ Assigned Volunteer</h3>
              <p><strong>{req.assignedVolunteer.name}</strong></p>
              <p>{req.assignedVolunteer.email}</p>
              <p>{req.assignedVolunteer.phone}</p>
            </div>
          )}

          {/* Volunteer selector panel */}
          {showVolPanel && (
            <div className="detail-card ard-vol-panel" style={{ marginTop: "20px" }}>
              <div className="ard-vol-panel-header">
                <h3>🙋 Select a Volunteer</h3>
                <button className="ard-close-btn" onClick={() => setShowVolPanel(false)}>✕</button>
              </div>
              <p className="ard-vol-subtitle">
                Showing volunteers near <strong>{req.district}</strong>
              </p>
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
                      onClick={() => setSelectedVol(v)}
                    >
                      <div className="ard-vol-name">{v.fullName}</div>
                      <div className="ard-vol-meta">
                        {v.volunteerRole || "—"} · {v.preferredZone || "—"}
                      </div>
                      <div className="ard-vol-meta">{v.phone}</div>
                      {v.preferredTime && (
                        <div className="ard-vol-time">🕐 {v.preferredTime}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedVol && (
                <div className="ard-selected-badge">
                  ✓ Selected: <strong>{selectedVol.fullName}</strong>
                  <button
                    className="ard-clear-btn"
                    onClick={() => setSelectedVol(null)}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Actions */}
        <div className="detail-right">
          <div className="detail-card">
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "6px" }}>Status</p>
            <p
              style={{
                fontWeight: "700",
                fontSize: "18px",
                textTransform: "capitalize",
                color:
                  req.status === "pending"
                    ? "#c0392b"
                    : req.status === "verified"
                    ? "#16a34a"
                    : "#888",
              }}
            >
              {req.status}
            </p>
          </div>

          {req.status !== "verified" && (
            <>
              {/* Assign volunteer toggle */}
              <div className="detail-card" style={{ marginTop: "16px" }}>
                <button
                  className="btn-admin"
                  style={{ width: "100%" }}
                  onClick={() => setShowVolPanel((p) => !p)}
                >
                  {showVolPanel ? "▲ Hide Volunteers" : "🙋 Assign Volunteer"}
                </button>
                {selectedVol && (
                  <p style={{ marginTop: "10px", fontSize: "13px", color: "#16a34a" }}>
                    ✓ {selectedVol.fullName} selected
                  </p>
                )}
              </div>

              {/* Action buttons */}
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
