import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Landing.css";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ volunteerCount: null, availableFunds: null });

  useEffect(() => {
    axios.get("http://localhost:3001/api/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const formatFunds = (amount) => {
    if (amount === null) return "...";
    if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
    return `৳${amount}`;
  };

  return (
    <div className="landing-wrapper">
      <div className="landing-container">

        {/* Left Content */}
        <div className="landing-left">
          <p className="landing-brand">
            <span className="brand-bd">BD</span> Disaster Relief Platform
          </p>

          <h1 className="landing-headline">
            Aid when it <br /> matters most.
          </h1>

          <p className="landing-description">
            ResQRelief connects affected communities with volunteers, supplies,
            and funding in real time — bringing the right help where it's needed most.
          </p>

          <div className="landing-actions">
            <button className="btn-login" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="btn-signup" onClick={() => navigate("/signup")}>
              Sign Up
            </button>
          </div>
        </div>

        {/* Right Stats */}
        <div className="landing-right">
          <div className="stat-card">
            <span className="stat-number volunteers">{stats.volunteerCount ?? "..."}</span>
            <span className="stat-label">Volunteers Deployed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number funds">{formatFunds(stats.availableFunds)}</span>
            <span className="stat-label">Funds Available</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;
