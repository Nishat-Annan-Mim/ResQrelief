import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./VolunteerRoleSetup.css";

const roles = [
  "Medical",
  "Logistics",
  "Distribution",
  "Driving",
  "Communication",
  "Technical",
];

const VolunteerRoleSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const isEditMode = location.state?.editMode || false;

  const [selectedRole, setSelectedRole] = useState("");
  const [skillsExperience, setSkillsExperience] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const response = await axios.get(
          `https://resqreliefcheck.onrender.com/volunteer/profile/${user.email}`,
        );

        setSelectedRole(response.data.volunteerRole || "");
        setSkillsExperience(response.data.skillsExperience || "");
        setAvailableFrom(response.data.availableFrom || "");
        setAvailableUntil(response.data.availableUntil || "");
        setPreferredTime(response.data.preferredTime || "");
      } catch (error) {
        console.log(error);
      }
    };

    if (user?.email) {
      fetchVolunteer();
    }
  }, [user?.email]);

  const handleSubmit = async () => {
    if (
      !selectedRole ||
      !skillsExperience ||
      !availableFrom ||
      !availableUntil ||
      !preferredTime
    ) {
      alert("Please complete all role setup fields");
      return;
    }

    try {
      await axios.put(
        `https://resqreliefcheck.onrender.com/volunteer/role-setup/${user.email}`,
        {
          volunteerRole: selectedRole,
          skillsExperience,
          availableFrom,
          availableUntil,
          preferredTime,
        },
      );

      alert(
        isEditMode
          ? "Volunteer profile updated successfully"
          : "Volunteer setup completed successfully",
      );

      navigate("/volunteer-dashboard");
    } catch (error) {
      console.log(error);
      alert("Could not save volunteer role setup");
    }
  };

  return (
    <div className="role-page">
      <div className="role-top-card">
        <h1>Select Your Roles</h1>

        <div className="role-grid">
          {roles.map((role) => (
            <div
              key={role}
              className={`role-card ${
                selectedRole === role ? "role-card-active" : ""
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <h3>{role}</h3>
            </div>
          ))}
        </div>

        <p className="selected-role-text">
          Selected: {selectedRole ? selectedRole.toUpperCase() : "NONE"}
        </p>
      </div>

      <div className="role-bottom-grid">
        <div className="skills-box">
          <h2>Skills and experienced</h2>
          <textarea
            value={skillsExperience}
            onChange={(e) => setSkillsExperience(e.target.value)}
            placeholder="Describe your relevant skills, write about your previous experience, paste links of certificates."
          />
        </div>

        <div className="availability-box">
          <h2>Availability</h2>

          <div className="availability-row">
            <div>
              <label>Available from</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>

            <div>
              <label>Available Until</label>
              <input
                type="date"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="preferred-time-wrap">
            <label>Preferred Time</label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            >
              <option value="">Select preferred time</option>
              <option value="Any time">Any time</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
        </div>
      </div>

      <div className="role-submit-wrap">
        <button onClick={handleSubmit}>
          {isEditMode ? "Update Profile" : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default VolunteerRoleSetup;
