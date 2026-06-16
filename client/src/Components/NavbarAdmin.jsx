import React from "react";
import { Link } from "react-router-dom";
import "./NavbarPrivate.css"; // Keeps your existing button/text styles active[cite: 3]
import NotificationBell from "./NotificationBell";

const NavbarAdmin = () => {
  return (
    // Outer bar: Forced to 100% screen width
    <div style={{ 
      width: "100%", 
      backgroundColor: "#ffffff", 
      borderBottom: "1px solid #e5e7eb", 
      position: "sticky", 
      top: 0, 
      zIndex: 50, 
      padding: "14px 24px", 
      boxSizing: "border-box" 
    }}>
      {/* Inner nav: Removes any max-width constraints and pushes items to the absolute sides */}
      <nav style={{ 
        width: "100%", 
        maxWidth: "none", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        margin: 0 
      }}>
        
        {/* Logo (Far Left) */}
        <span className="logo logo-main">
          ResQ<span className="logo-highlight">Relief</span>
          <span style={{ fontSize: "12px", color: "#c0392b", marginLeft: "8px", fontWeight: "700" }}>ADMIN</span>
        </span>

        {/* Links (Far Right) */}
        <ul className="nav-links" style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "24px", 
          listStyle: "none", 
          margin: 0, 
          padding: 0 
        }}>
          <li>
            <NotificationBell />
          </li>
          <li>
            <Link to="/logout" className="nav-item logout-btn">Logout</Link>
          </li>
        </ul>
        
      </nav>
    </div>
  );
};

export default NavbarAdmin;