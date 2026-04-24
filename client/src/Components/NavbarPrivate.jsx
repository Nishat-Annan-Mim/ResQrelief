import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./NavbarPrivate.css";
import NotificationBell from "./NotificationBell";

const NavbarPrivate = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar-container">
      <nav className="navbar">
        <span className="logo logo-main">
          ResQ<span className="logo-highlight">Relief</span>
        </span>

        {/* Hamburger button - only visible on mobile */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li><Link to="/home" className="nav-item" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/volunteer" className="nav-item" onClick={() => setMenuOpen(false)}>Volunteer</Link></li>
          <li><Link to="/request-aid" className="nav-item" onClick={() => setMenuOpen(false)}>Request Aid</Link></li>
          <li><Link to="/donate" className="nav-item" onClick={() => setMenuOpen(false)}>Donate</Link></li>
          <li><Link to="/my-donations" className="nav-item" onClick={() => setMenuOpen(false)}>My Donations</Link></li>
          <li><NotificationBell /></li>
          <li><Link to="/collaboration-portal" className="nav-item" onClick={() => setMenuOpen(false)}>Collab Portal</Link></li>
          <li><Link to="/logout" className="nav-item logout-btn" onClick={() => setMenuOpen(false)}>Logout</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default NavbarPrivate;