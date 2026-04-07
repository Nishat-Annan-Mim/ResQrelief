import React from "react";
import "./Landing.css";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

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
            <span className="stat-number volunteers">84</span>
            <span className="stat-label">Volunteers Deployed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number funds">৳40.2K</span>
            <span className="stat-label">Funds Raised</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;