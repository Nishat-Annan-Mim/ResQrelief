import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Adminvolunteers.css";

const Adminvolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [aidRequests, setAidRequests] = useState([]);
  const [aidRequestsLoading, setAidRequestsLoading] = useState(true);

  const fetchVolunteers = () => {
    axios
      .get("https://resqrelief-fj7z.onrender.com/api/volunteers/all")
      .then((response) => {
        setVolunteers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  };
  const fetchAidRequests = () => {
    axios
      .get("https://resqrelief-fj7z.onrender.com/api/admin/aid-requests")
      .then((response) => {
        setAidRequests(response.data);
        setAidRequestsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setAidRequestsLoading(false);
      });
  };

  useEffect(() => {
    fetchVolunteers();
    fetchAidRequests();
  }, []);

  const confirmVolunteer = (volunteerId) => {
    axios
      .put(
        `https://resqrelief-fj7z.onrender.com/api/volunteer/confirm/${volunteerId}`,
      )
      .then(() => {
        setVolunteers((prev) =>
          prev.map((vol) =>
            vol._id === volunteerId ? { ...vol, status: "confirmed" } : vol,
          ),
        );
      })
      .catch((error) => console.log(error));
  };

  const removeVolunteer = (volunteerId, volunteerName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${volunteerName}"? They will need to register again.`,
    );

    if (!confirmed) return;

    axios
      .delete(
        `https://resqrelief-fj7z.onrender.com/api/volunteer/remove/${volunteerId}`,
      )
      .then(() => {
        setVolunteers((prev) => prev.filter((vol) => vol._id !== volunteerId));
      })
      .catch((error) => console.log(error));
  };
  const deleteAidRequest = (requestId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this aid request?",
    );
    if (!confirmed) return;

    axios
      .delete(
        `https://resqrelief-fj7z.onrender.com/api/admin/aid-requests/${requestId}`,
      )
      .then(() => {
        setAidRequests((prev) => prev.filter((r) => r._id !== requestId));
      })
      .catch((error) => console.log(error));
  };

  const openModal = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const closeModal = () => {
    setSelectedVolunteer(null);
  };

  return (
    <>
      <div className="table-wrapper">
        <h1>Volunteer Registration Confirmation</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((volunteer) => (
              <tr key={volunteer._id}>
                <td>{volunteer.fullName}</td>
                <td>{volunteer.email}</td>
                <td>{volunteer.phone}</td>
                <td>{volunteer.status || "pending"}</td>
                <td className="action-buttons">
                  {/* View Button — always visible */}
                  <button
                    className="view-btn"
                    onClick={() => openModal(volunteer)}
                  >
                    View
                  </button>

                  {volunteer.status === "confirmed" ? (
                    <span className="confirmed-badge">✔ Confirmed</span>
                  ) : (
                    <button
                      className="confirm-btn"
                      onClick={() => confirmVolunteer(volunteer._id)}
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    className="remove-btn"
                    onClick={() =>
                      removeVolunteer(volunteer._id, volunteer.fullName)
                    }
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Modal Popup ── */}
        {selectedVolunteer && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-box"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
            >
              <div className="modal-header">
                <h2>Volunteer Details</h2>
                <button className="modal-close-btn" onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-row">
                  <span className="modal-label">Full Name</span>
                  <span className="modal-value">
                    {selectedVolunteer.fullName}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Email</span>
                  <span className="modal-value">{selectedVolunteer.email}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Phone</span>
                  <span className="modal-value">{selectedVolunteer.phone}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Date of Birth</span>
                  <span className="modal-value">
                    {selectedVolunteer.dateOfBirth}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Gender</span>
                  <span className="modal-value">
                    {selectedVolunteer.gender}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Address</span>
                  <span className="modal-value">
                    {selectedVolunteer.address}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Emergency Contact</span>
                  <span className="modal-value">
                    {selectedVolunteer.emergencyContact}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">NID Number</span>
                  <span className="modal-value">
                    {selectedVolunteer.nidNumber}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Status</span>
                  <span
                    className={`modal-value ${selectedVolunteer.status === "confirmed" ? "status-confirmed" : "status-pending"}`}
                  >
                    {selectedVolunteer.status || "pending"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Volunteer Role</span>
                  <span className="modal-value">
                    {selectedVolunteer.volunteerRole || "Not set"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Preferred Zone</span>
                  <span className="modal-value">
                    {selectedVolunteer.preferredZone || "Not set"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Skills & Experience</span>
                  <span className="modal-value">
                    {selectedVolunteer.skillsExperience || "Not set"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Available From</span>
                  <span className="modal-value">
                    {selectedVolunteer.availableFrom || "Not set"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Available Until</span>
                  <span className="modal-value">
                    {selectedVolunteer.availableUntil || "Not set"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Preferred Time</span>
                  <span className="modal-value">
                    {selectedVolunteer.preferredTime || "Not set"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Profile Completed</span>
                  <span className="modal-value">
                    {selectedVolunteer.profileCompleted ? "Yes" : "No"}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Registered On</span>
                  <span className="modal-value">
                    {new Date(selectedVolunteer.createdAt).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-close-footer-btn" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Aid Requests Table ── */}
      <div className="table-wrapper" style={{ marginTop: "40px" }}>
        <h1>Aid Requests from Map Board</h1>
        {aidRequestsLoading ? (
          <p>Loading aid requests...</p>
        ) : aidRequests.length === 0 ? (
          <p>No aid requests posted yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Posted By</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Address / Location</th>
                <th>Posted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {aidRequests.map((request, index) => (
                <tr key={request._id}>
                  <td>{index + 1}</td>
                  <td>{request.createdByVolunteerName || "Unknown"}</td>
                  <td>{request.requestType}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        color: "#fff",
                        background:
                          request.severity === "emergency"
                            ? "#e63946"
                            : request.severity === "medium"
                              ? "#f4a261"
                              : "#6c757d",
                      }}
                    >
                      {request.severity.charAt(0).toUpperCase() +
                        request.severity.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        color: "#fff",
                        background:
                          request.status === "helped"
                            ? "#2d6a4f"
                            : request.status === "helping"
                              ? "#0077b6"
                              : "#e63946",
                      }}
                    >
                      {request.status === "need"
                        ? "Needs Help"
                        : request.status === "helping"
                          ? "Help Coming"
                          : "Helped ✔"}
                    </span>
                  </td>
                  <td>
                    {request.address ? (
                      <a
                        href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#0077b6",
                          fontWeight: "600",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                        }}
                      >
                        📍 {request.address.slice(0, 40)}...
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#0077b6",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        📍 View on Map
                      </a>
                    )}
                  </td>
                  <td>
                    {new Date(request.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="action-buttons">
                    <button
                      className="remove-btn"
                      onClick={() => deleteAidRequest(request._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Adminvolunteers;
