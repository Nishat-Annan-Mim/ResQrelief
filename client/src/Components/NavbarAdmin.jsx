import React from "react";
import { Link } from "react-router-dom";
import "./NavbarPrivate.css"; // reuse same styles
import NotificationBell from "./NotificationBell";

const NavbarAdmin = () => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        <span className="logo logo-main">
          ResQ<span className="logo-highlight">Relief</span>
          <span style={{ fontSize: "12px", color: "#c0392b", marginLeft: "8px", fontWeight: "700" }}>ADMIN</span>
        </span>

        <ul className="nav-links">
          <li><Link to="/transparency" className="nav-item">Transparency</Link></li>
          <li><Link to="/admin-home" className="nav-item">Dashboard</Link></li>
          <li><Link to="/inventory" className="nav-item">Inventory</Link></li>
          <li><Link to="/donor-impact"  className="nav-item">Donor Impact</Link></li>        {/* ← ADD HERE */}
          <li><Link to="/storage-analytics"  className="nav-item">Storage Analytics</Link></li>  {/* ← ADD HERE */}
          <li>
            <NotificationBell />
          </li>
          <li><Link to="/logout" className="nav-item logout-btn">Logout</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default NavbarAdmin;