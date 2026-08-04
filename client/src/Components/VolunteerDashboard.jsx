// export default VolunteerDashboard;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  CircleCheck,
  Hourglass,
  UserRound,
  Sparkles,
  MapPin,
  Target,
  Clock,
  Pencil,
  Check,
  X,
  Map,
  Truck,
  CheckSquare,
  Bell,
  Users,
  ChevronRight,
} from "lucide-react";
import "./VolunteerDashboard.css";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState("");
  const [editValue, setEditValue] = useState("");
  const [notifications, setNotifications] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const needPassword = localStorage.getItem("needVolunteerPassword"); // Check if password prompt is needed

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          "https://resqrelief-fj7z.onrender.com/api/alerts",
        );
        const volunteerAlerts = res.data.filter((a) =>
          a.audience.includes("volunteers"),
        );
        setNotifications(volunteerAlerts);
      } catch (err) {
        console.log(err);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const response = await axios.get(
          `https://resqrelief-fj7z.onrender.com/volunteer/profile/${user.email}`,
        );
        setVolunteer(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (user?.email) {
      fetchVolunteer();
    }
  }, [user?.email]);

  // Handle password submission
  const handlePasswordSubmit = async () => {
    try {
      const res = await axios.post(
        "https://resqrelief-fj7z.onrender.com/volunteer/login",
        {
          email: user.email,
          password: password,
        },
      );

      if (res.status === 200) {
        // Successfully verified the password, remove the needPassword flag
        localStorage.setItem("needVolunteerPassword", "false");
        navigate("/volunteer-dashboard");
      }
    } catch (err) {
      setError("Incorrect volunteer password.");
    }
  };

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEdit = () => {
    setEditingField("");
    setEditValue("");
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `https://resqrelief-fj7z.onrender.com/volunteer/update/${user.email}`,
        {
          [editingField]: editValue,
        },
      );

      setVolunteer((prev) => ({
        ...prev,
        [editingField]: editValue,
      }));

      setEditingField("");
      setEditValue("");
      alert("Volunteer information updated successfully");
    } catch (error) {
      console.log(error);
      alert("Could not update volunteer information");
    }
  };

  if (!volunteer) {
    return <div className="volunteer-dashboard-page">Loading...</div>;
  }

  /* Reusable inline-edit row so the three editable fields stay in sync. */
  const EditableRow = ({ label, field, value }) => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      {editingField === field ? (
        <div className="edit-inline-box">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <button className="save-btn" onClick={saveEdit}>
            <Check size={13} strokeWidth={2.5} />
            Save
          </button>
          <button className="cancel-btn" onClick={cancelEdit}>
            <X size={13} strokeWidth={2.5} />
            Cancel
          </button>
        </div>
      ) : (
        <>
          <span className="info-value">{value}</span>
          <button
            className="mini-edit-btn"
            onClick={() => startEdit(field, value)}
          >
            <Pencil size={12} strokeWidth={2} />
            Edit
          </button>
        </>
      )}
    </div>
  );

  const quickLinks = [
    { label: "Edit Zone", icon: MapPin, onClick: () =>
        navigate("/volunteer-zone-select", { state: { editMode: true } }) },
    { label: "Edit Role & Availability", icon: Target, onClick: () =>
        navigate("/volunteer-role-setup", { state: { editMode: true } }) },
    { label: "View All Volunteers", icon: Users, onClick: () =>
        navigate("/volunteer-directory") },
    { label: "Live Map & Requests", icon: Map, onClick: () =>
        navigate("/volunteer-map-board") },
    { label: "My Relief Operations", icon: Truck, onClick: () =>
        navigate("/volunteer-operations") },
    { label: "My Assigned Tasks", icon: CheckSquare, onClick: () =>
        navigate("/volunteer-tasks") },
    { label: "Emergency Alerts", icon: Bell, onClick: () =>
        navigate("/user-alerts") },
  ];

  return (
    <div className="volunteer-dashboard-page">
      {/* Password prompt — unreachable while RequireVolunteerAuth guards
          this route, but kept so the component still stands alone. */}
      {needPassword === "true" && (
        <div className="vd-container">
          <h2>Enter Volunteer Password</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          {error && <p>{error}</p>}
          <button onClick={handlePasswordSubmit}>Submit</button>
        </div>
      )}

      {needPassword !== "true" && (
        <div className="vd-container">
          {/* ── Header ── */}
          <div className="volunteer-dashboard-card">
            <h1>
              <LayoutDashboard size={22} strokeWidth={1.75} />
              Volunteer Dashboard
            </h1>
            <p>
              Welcome back, {volunteer.fullName}. Your volunteer profile is
              active and ready.
            </p>
          </div>

          {/* ── Approval status ── */}
          <div
            className={`admin-confirmation-banner ${
              volunteer.status === "confirmed"
                ? "banner-confirmed"
                : "banner-pending"
            }`}
          >
            {volunteer.status === "confirmed" ? (
              <>
                <CircleCheck size={15} strokeWidth={2} />
                <span>
                  <strong>Confirmed by Admin</strong> — Your volunteer
                  registration has been approved.
                </span>
              </>
            ) : (
              <>
                <Hourglass size={15} strokeWidth={2} />
                <span>
                  <strong>Not Confirmed Yet</strong> — Your registration is
                  under review.
                </span>
              </>
            )}
          </div>

          {/* ── Summary ── */}
          <div className="vd-stats">
            <div className="vd-stat-card">
              <p>
                <MapPin size={13} strokeWidth={2} />
                Your Zone
              </p>
              <h3>{volunteer.preferredZone || "Not set"}</h3>
            </div>
            <div className="vd-stat-card">
              <p>
                <Target size={13} strokeWidth={2} />
                Your Role
              </p>
              <h3>{volunteer.volunteerRole || "Not set"}</h3>
            </div>
            <div className="vd-stat-card">
              <p>
                <Clock size={13} strokeWidth={2} />
                Availability
              </p>
              <h3>{volunteer.preferredTime || "Flexible"}</h3>
            </div>
          </div>

          {/* ── Profile + skills ── */}
          <div className="vd-grid">
            <div className="volunteer-info-card">
              <h2>
                <UserRound size={16} strokeWidth={1.75} />
                Volunteer Information
              </h2>

              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{volunteer.fullName}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{volunteer.email}</span>
              </div>

              <EditableRow
                label="Phone"
                field="phone"
                value={volunteer.phone}
              />
              <EditableRow
                label="Address"
                field="address"
                value={volunteer.address}
              />
              <EditableRow
                label="Emergency Contact"
                field="emergencyContact"
                value={volunteer.emergencyContact}
              />

              <div className="info-row">
                <span className="info-label">Preferred Zone</span>
                <span className="info-value">
                  {volunteer.preferredZone || "Not selected yet"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Role</span>
                <span className="info-value">
                  {volunteer.volunteerRole || "Not selected yet"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Preferred Time</span>
                <span className="info-value">
                  {volunteer.preferredTime || "Not selected yet"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Status</span>
                <span
                  className={`ad-pill ${
                    volunteer.isVerified
                      ? "ad-pill-success"
                      : "ad-pill-warning"
                  }`}
                >
                  {volunteer.isVerified ? "Verified Volunteer" : "Pending"}
                </span>
              </div>
            </div>

            <div className="volunteer-skills-card">
              <h2>
                <Sparkles size={16} strokeWidth={1.75} />
                Skills &amp; Experience
              </h2>
              <p>
                {volunteer.skillsExperience ||
                  "No skills or experience added yet."}
              </p>
            </div>
          </div>

          {/* ── Quick links ── */}
          <p className="vd-section-label">Quick Links</p>
          <div className="dashboard-buttons">
            {quickLinks.map(({ label, icon: Icon, onClick }) => (
              <button key={label} onClick={onClick}>
                <Icon size={17} strokeWidth={1.75} />
                {label}
                <ChevronRight size={15} strokeWidth={2} className="vd-chevron" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
