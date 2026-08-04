import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Home,
  HandHeart,
  HeartHandshake,
  Receipt,
  Bell,
  Handshake,
  LayoutDashboard,
  CheckSquare,
  Truck,
  Map,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Lock,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { FlaggedBanner } from "./AccountFlag";
import "./UserLayout.css";

/* Links every signed-in person can reach. */
const GENERAL_ITEMS = [
  { label: "Home", path: "/home", icon: Home },
  { label: "Request Aid", path: "/request-aid", icon: HandHeart },
  { label: "Donate", path: "/donate", icon: HeartHandshake },
  { label: "My Donations", path: "/my-donations", icon: Receipt },
  { label: "Alerts", path: "/user-alerts", icon: Bell },
  { label: "NGO Collaboration", path: "/collaboration-portal", icon: Handshake },
];

/* Shown only once the volunteer check confirms an account. */
const VOLUNTEER_ITEMS = [
  { label: "Dashboard", path: "/volunteer-dashboard", icon: LayoutDashboard },
  { label: "My Tasks", path: "/volunteer-tasks", icon: CheckSquare },
  { label: "Operations", path: "/volunteer-operations", icon: Truck },
  { label: "Map Board", path: "/volunteer-map-board", icon: Map },
  { label: "Directory", path: "/volunteer-directory", icon: Users },
];

/* Offered to people who don't have a volunteer account yet. */
const BECOME_VOLUNTEER = {
  label: "Become a Volunteer",
  path: "/volunteer",
  icon: UserPlus,
};

/* Shown when a volunteer hasn't entered their volunteer password yet. */
const UNLOCK_VOLUNTEER = {
  label: "Unlock Volunteer Portal",
  path: "/volunteer-dashboard-password",
  icon: Lock,
};

const UserLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(
    () => sessionStorage.getItem("ul:isVolunteer") === "true",
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { mobileOpen, setMobileOpen } = useSidebar();

  /*
   * Read on every render (not held in state) so the sidebar reflects the
   * unlock the moment the user lands on a volunteer page after entering
   * their password.
   */
  const volunteerLocked =
    localStorage.getItem("needVolunteerPassword") === "true";

  /*
   * Mirrors the existing check in Volunteer.jsx so the sidebar can hide
   * volunteer-only links. Read-only: it never redirects and never writes
   * to the keys the rest of the app relies on. The result is cached in
   * sessionStorage so navigating between pages doesn't refetch.
   */
  useEffect(() => {
    let cancelled = false;

    const checkVolunteer = async () => {
      try {
        const stored = localStorage.getItem("user");
        const user = stored ? JSON.parse(stored) : null;
        if (!user?.email) return;

        const res = await axios.get(
          `https://resqrelief-fj7z.onrender.com/volunteer/check/${user.email}`,
        );
        if (cancelled) return;

        const value = Boolean(res.data?.isVolunteer);
        setIsVolunteer(value);
        sessionStorage.setItem("ul:isVolunteer", String(value));
      } catch {
        /* Sidebar simply stays in its last known state. */
      }
    };

    checkVolunteer();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderItem = ({ label, path, icon: Icon }) => {
    const isActive = location.pathname === path;
    return (
      <button
        key={path}
        className={`ul-nav-item ${isActive ? "ul-nav-item--active" : ""}`}
        onClick={() => {
          navigate(path);
          setMobileOpen(false);
        }}
        title={collapsed ? label : undefined}
      >
        <span className="ul-nav-icon">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        {!collapsed && <span className="ul-nav-label">{label}</span>}
        {isActive && !collapsed && <span className="ul-nav-indicator" />}
      </button>
    );
  };

  return (
    <div className="ul-root">
      {mobileOpen && (
        <div className="ul-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`ul-sidebar ${collapsed ? "ul-sidebar--collapsed" : ""} ${
          mobileOpen ? "ul-sidebar--mobile-open" : ""
        }`}
      >
        <div className="ul-sidebar-header">
          {!collapsed && (
            <span className="ul-brand">
              <Shield size={18} className="ul-brand-icon" />
              ResQRelief
            </span>
          )}
          <button
            className="ul-toggle-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="ul-nav">
          {!collapsed && <p className="ul-nav-section">General</p>}
          {GENERAL_ITEMS.map(renderItem)}

          {!isVolunteer && renderItem(BECOME_VOLUNTEER)}

          {isVolunteer && (
            <>
              {!collapsed && <p className="ul-nav-section">Volunteer</p>}
              {/*
               * Volunteer pages are behind the volunteer password. While
               * locked, offer the unlock step instead of links that would
               * only bounce the user back to it.
               */}
              {volunteerLocked
                ? renderItem(UNLOCK_VOLUNTEER)
                : VOLUNTEER_ITEMS.map(renderItem)}
            </>
          )}
        </nav>
      </aside>

      <main className="ul-main">
        <FlaggedBanner />
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
