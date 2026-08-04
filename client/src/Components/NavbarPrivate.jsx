import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, X, TriangleAlert } from "lucide-react";
import "./NavbarPrivate.css";
import NotificationBell from "./NotificationBell";
import { useSidebar } from "./SidebarContext";
import { useAccount } from "./AccountContext";

/*
 * Slim top bar for signed-in users. Page navigation now lives in the
 * sidebar (UserLayout), so this only carries the brand, notifications
 * and logout.
 */
const NavbarPrivate = () => {
  const { mobileOpen, toggleMobile } = useSidebar();
  const { isBanned } = useAccount();

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

      <Link to="/home" className="np-brand">
        ResQ<span className="np-brand-accent">Relief</span>
      </Link>

      {isBanned && (
        <span className="np-flag" title="Account flagged for review">
          <TriangleAlert size={13} strokeWidth={2.5} />
          Flagged
        </span>
      )}

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

export default NavbarPrivate;
