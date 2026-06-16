import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Helicopter,
  Bell,
  CheckSquare,
  Handshake,
  Eye,
  Heart,
  BarChart2,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { label: "Dashboard",         path: "/admin-home",          icon: LayoutDashboard },
  { label: "Requests",          path: "/admin-requests",       icon: ClipboardList },
  { label: "Inventory",         path: "/inventory",            icon: Package },
  { label: "Volunteers",        path: "/admin-volunteers",     icon: Users },
  { label: "Relief Operations", path: "/admin-operations",     icon: Helicopter },
  { label: "Alerts",            path: "/admin-alerts",         icon: Bell },
  { label: "Task Management",   path: "/admin-tasks",          icon: CheckSquare },
  { label: "NGO Collaboration", path: "/collaboration-portal", icon: Handshake },
  { label: "Transparency",      path: "/transparency",         icon: Eye },
  { label: "Donor Impact",      path: "/donor-impact",         icon: Heart },
  { label: "Storage Analytics", path: "/storage-analytics",    icon: BarChart2 },
];

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="al-root">
      {!collapsed && (
        <div className="al-overlay" onClick={() => setCollapsed(true)} />
      )}

      <aside className={`al-sidebar ${collapsed ? "al-sidebar--collapsed" : ""}`}>
        <div className="al-sidebar-header">
          {!collapsed && (
            <span className="al-brand">
              <Shield size={18} className="al-brand-icon" />
              ResQRelief
            </span>
          )}
          <button
            className="al-toggle-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="al-nav">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                className={`al-nav-item ${isActive ? "al-nav-item--active" : ""}`}
                onClick={() => navigate(path)}
                title={collapsed ? label : undefined}
              >
                <span className="al-nav-icon">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                {!collapsed && <span className="al-nav-label">{label}</span>}
                {isActive && !collapsed && <span className="al-nav-indicator" />}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="al-main">{children}</main>
    </div>
  );
};

export default AdminLayout;