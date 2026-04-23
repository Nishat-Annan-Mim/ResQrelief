import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./VolunteerPassword.css";

const VolunteerPassword = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "https://resqreliefcheck.onrender.com/volunteer/login",
        {
          email: user.email,
          password: password,
        },
      );

      if (response.status === 200) {
        // Clear the need for password flag
        localStorage.removeItem("needVolunteerPassword");

        // Check if profile is completed
        const profileResponse = await axios.get(
          `https://resqreliefcheck.onrender.com/volunteer/check/${user.email}`,
        );

        if (profileResponse.data.profileCompleted) {
          navigate("/volunteer-dashboard");
        } else {
          navigate("/volunteer-onboarding");
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setMessage("Incorrect password. Please try again.");
      } else {
        setMessage("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="volunteer-password-container">
      <div className="volunteer-password-card">
        <h2>Enter Volunteer Password</h2>
        <p>Please enter your volunteer password to access the dashboard.</p>

        <form onSubmit={handleSubmit} className="volunteer-password-form">
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your volunteer password"
            />
          </div>

          {message && (
            <div
              className="message"
              style={{ color: message.includes("Incorrect") ? "red" : "green" }}
            >
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Verifying..." : "Submit"}
          </button>
        </form>

        <div className="back-link">
          <button onClick={() => navigate("/home")} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VolunteerPassword;