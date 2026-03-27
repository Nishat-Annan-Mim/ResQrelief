// import React from "react";

// const Home = () => {
//   return <div>swee home welcome Home</div>;
// };

// export default Home;

import React from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
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

export default Home;