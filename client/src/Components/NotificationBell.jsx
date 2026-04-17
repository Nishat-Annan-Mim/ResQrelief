import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const email = sessionStorage.getItem("email");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const res = await axios.get(`http://localhost:3001/api/notifications/${email}`);
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // ✅ Connect socket for real-time
    if (email) {
      socketRef.current = io("http://localhost:3001", {
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        socketRef.current.emit("join", email);
      });

      // When a new alert comes in, refresh notifications
      socketRef.current.on("alert", () => {
        fetchNotifications();
      });
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((prev) => !prev);

    // Mark all as read when opening
    if (!open && unreadCount > 0) {
      await axios.put(`http://localhost:3001/api/notifications/read-all/${email}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleClick = async (notif) => {
    // Mark individual as read
    try {
      await axios.put(`http://localhost:3001/api/notifications/read/${notif._id}`);
    } catch (err) {
      console.log(err);
    }
    setOpen(false);
    
    // ✅ NEW ROUTING LOGIC: Intercept "alert" types and route them correctly
    if (notif.link) {
      navigate(notif.link);
    } else if (notif.type === "alert") {
      navigate("/user-alerts");
    }
  };

  const timeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 60000);
    if (diff < 1)  return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getIcon = (type) => {
    if (type === "request_verified")  return "✅";
    if (type === "volunteer_assigned") return "🙋";
    if (type === "alert")             return "🚨";
    return "🔔";
  };

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button className="notif-bell-btn" onClick={handleOpen} style={{ display: 'flex', alignItems: 'center' }}>
        {/* FIX: Silver SVG Bell instead of text emoji */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666666"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button
                className="notif-clear-btn"
                onClick={async () => {
                  await axios.put(`http://localhost:3001/api/notifications/read-all/${email}`);
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item ${!notif.read ? "notif-unread" : ""}`}
                  onClick={() => handleClick(notif)}
                >
                  <div className="notif-icon">{getIcon(notif.type)}</div>
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-msg">{notif.message}</p>
                    <p className="notif-time">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;