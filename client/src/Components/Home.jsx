import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ volunteerCount: null, availableFunds: null });

  useEffect(() => {
    axios.get("https://resqrelief-fj7z.onrender.com/api/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const formatFunds = (amount) => {
    if (amount === null) return "...";
    if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
    return `৳${amount}`;
  };

  return (
    <div className="home-wrapper">
      <div className="home-container">
        {/* Left Content */}
        <div className="home-left">
          <p className="home-brand">
            <span className="brand-bd">BD</span> Disaster Relief Platform
          </p>

          <h1 className="home-headline">
            Aid when it <br /> matters most.
          </h1>

          <p className="home-description">
            ResQRelief connects affected communities with volunteers, supplies,
            and funding in real time—bringing the right help where it's needed
            most.
          </p>

          <div className="home-actions">
            <button className="btn-request" onClick={() => navigate("/request-aid")}>Request Aid</button>
            <button className="btn-donate">Donate</button>
          </div>
        </div>

        {/* Right Stats */}
        <div className="home-right">
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

export default Home;
