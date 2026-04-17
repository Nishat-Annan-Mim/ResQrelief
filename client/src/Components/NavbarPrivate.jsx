import React from "react";
import { Link } from "react-router-dom";
import "./NavbarPrivate.css";
import NotificationBell from "./NotificationBell"; 
const NavbarPrivate = () => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        {/* Logo */}
        <span className="logo logo-main">
          ResQ<span className="logo-highlight">Relief</span>
        </span>

        {/* Navigation Links */}
        <ul className="nav-links">
          <li>
            <Link to="/home" className="nav-item">
              Home
            </Link>
          </li>

          <li>
            <Link to="/volunteer" className="nav-item">
              Volunteer
            </Link>
          </li>

          <li>
            <Link to="/request-aid" className="nav-item">
              Request Aid
            </Link>
          </li>

          <li>
            <Link to="/donate" className="nav-item">
              Donate
            </Link>
          </li>
          <li>
            <Link to="/my-donations" className="nav-item">
              My Donations
            </Link>
          </li>
          <li>
            <NotificationBell />
          </li>

          <li>
            <Link to="/collaboration-portal" className="nav-item">Collab Portal</Link>
          </li>

          <li>
            <Link to="/logout" className="nav-item logout-btn">
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default NavbarPrivate;
