import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import "./NavbarPrivate.css"; // shared slim top-bar styles
import NotificationBell from "./NotificationBell";
import { useSidebar } from "./SidebarContext";

/*
 * Slim top bar for admins. Page navigation lives in AdminLayout's
 * sidebar, so this only carries the brand, notifications and logout —
 * matching the signed-in user bar.
 */
const NavbarAdmin = () => {
  const { mobileOpen, toggleMobile } = useSidebar();

  return (
    <header className="np-topbar">
      <button
        className="np-menu-btn"
        onClick={toggleMobile}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X size={20} strokeWidth={2} />
        ) : (
          <Menu size={20} strokeWidth={2} />
        )}
      </button>

      <Link to="/admin-home" className="np-brand">
        ResQ<span className="np-brand-accent">Relief</span>
        <span className="np-badge">Admin</span>
      </Link>

      <div className="np-actions">
        <NotificationBell />
        <Link to="/logout" className="np-logout">
          <LogOut size={14} strokeWidth={2} />
          Logout
        </Link>
      </div>
    </header>
  );
};

export default NavbarAdmin;
