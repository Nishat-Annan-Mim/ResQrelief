import React from "react";
import { Link } from "react-router-dom";
import "./NavbarPrivate.css";

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
            <Link to="/admin" className="nav-item">
              Admin
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
            <Link to="/transparency" className="nav-item">
              Transparency
            </Link>
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
