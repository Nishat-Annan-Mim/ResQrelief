import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  ClipboardList,
  Eye,
  Check,
  Trash2,
  X,
  MapPin,
} from "lucide-react";
import "./Adminvolunteers.css";
import AdminLayout from "./AdminLayout";

const SEVERITY_PILL = {
  emergency: "ad-pill-danger",
  medium: "ad-pill-warning",
  low: "ad-pill-neutral",
};

const STATUS_PILL = {
  need: "ad-pill-danger",
  helping: "ad-pill-info",
  helped: "ad-pill-success",
};

const STATUS_LABEL = {
  need: "Needs Help",
  helping: "Help Coming",
  helped: "Helped",
};

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
    <AdminLayout>
      <div className="table-wrapper">
        <h1>
          <Users size={18} strokeWidth={1.75} />
          Volunteer Registration Confirmation
        </h1>
        <table className="ad-stack">
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
                <td data-label="Name">{volunteer.fullName}</td>
                <td data-label="Email">{volunteer.email}</td>
                <td data-label="Phone">{volunteer.phone}</td>
                <td data-label="Status">{volunteer.status || "pending"}</td>
                <td className="action-buttons" data-label="Action">
                  {/* View Button — always visible */}
                  <button
                    className="view-btn"
                    onClick={() => openModal(volunteer)}
                  >
                    <Eye size={14} strokeWidth={2} />
                    View
                  </button>

                  {volunteer.status === "confirmed" ? (
                    <span className="confirmed-badge">
                      <Check size={13} strokeWidth={2.5} />
                      Confirmed
                    </span>
                  ) : (
                    <button
                      className="confirm-btn"
                      onClick={() => confirmVolunteer(volunteer._id)}
                    >
                      <Check size={14} strokeWidth={2.5} />
                      Confirm
                    </button>
                  )}
                  <button
                    className="remove-btn"
                    onClick={() =>
                      removeVolunteer(volunteer._id, volunteer.fullName)
                    }
                  >
                    <Trash2 size={14} strokeWidth={2} />
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
                <button
                  className="modal-close-btn"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2} />
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
      <div className="table-wrapper">
        <h1>
          <ClipboardList size={18} strokeWidth={1.75} />
          Aid Requests from Map Board
        </h1>
        {aidRequestsLoading ? (
          <p>Loading aid requests...</p>
        ) : aidRequests.length === 0 ? (
          <p>No aid requests posted yet.</p>
        ) : (
          <table className="ad-stack">
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
                  <td data-label="#">{index + 1}</td>
                  <td data-label="Posted By">
                    {request.createdByVolunteerName || "Unknown"}
                  </td>
                  <td data-label="Type">{request.requestType}</td>
                  <td data-label="Severity">
                    <span
                      className={`ad-pill ${
                        SEVERITY_PILL[request.severity] || "ad-pill-neutral"
                      }`}
                    >
                      {request.severity.charAt(0).toUpperCase() +
                        request.severity.slice(1)}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`ad-pill ${
                        STATUS_PILL[request.status] || "ad-pill-neutral"
                      }`}
                    >
                      <span className="ad-dot" />
                      {STATUS_LABEL[request.status] || request.status}
                    </span>
                  </td>
                  <td data-label="Address / Location">
                    <a
                      className="map-link"
                      href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin size={14} strokeWidth={2} />
                      {request.address
                        ? `${request.address.slice(0, 40)}…`
                        : "View on Map"}
                    </a>
                  </td>
                  <td data-label="Posted At">
                    {new Date(request.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="action-buttons" data-label="Action">
                    <button
                      className="remove-btn"
                      onClick={() => deleteAidRequest(request._id)}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default Adminvolunteers;
