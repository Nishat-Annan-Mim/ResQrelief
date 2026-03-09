import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        <span className="logo logo-main">
          ResQ<span className="logo-highlight">Relief</span>
        </span>

        <ul className="nav-links">
          <li>
            <Link to="/login" className="btn login-btn">
              Login
            </Link>
          </li>

          <li>
            <Link to="/signup" className="btn signup-btn">
              Signup
            </Link>
          </li>

          <li hidden>
            <Link to="/logout" className="btn logout-btn">
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
