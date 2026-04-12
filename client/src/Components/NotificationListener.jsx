import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const NotificationListener = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const email = storedUser.email || sessionStorage.getItem("email");
    if (!email) {
      console.warn("⚠️ NotificationListener: No email in sessionStorage. Socket not connected.");
      return;
    }

    socketRef.current = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);
      socketRef.current.emit("join", email);
    });

    socketRef.current.on("alert", (data) => {
      showNotification(data.title, data.message);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return null;
};

function showNotification(title, message) {
  // Inject keyframes once
  if (!document.getElementById("rq-notif-styles")) {
    const style = document.createElement("style");
    style.id = "rq-notif-styles";
    style.textContent = `
      @keyframes rqSlideIn {
        from { transform: translateX(120%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
      @keyframes rqFadeOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Create or reuse container
  let container = document.getElementById("rq-notif-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "rq-notif-container";
    Object.assign(container.style, {
      position: "fixed",
      top: "80px",       // below navbar
      right: "20px",
      zIndex: "999999",  // very high to clear any stacking context
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      pointerEvents: "none",
    });
    document.body.appendChild(container);
  }

  const notif = document.createElement("div");
  Object.assign(notif.style, {
    background: "#c0392b",
    color: "white",
    padding: "16px 20px",
    borderRadius: "10px",
    maxWidth: "340px",
    fontFamily: "sans-serif",
    pointerEvents: "auto",
    animation: "rqSlideIn 0.3s ease forwards",
  });

  notif.innerHTML = `
    <div style="font-weight:700;font-size:15px;margin-bottom:6px;">🚨 ${title}</div>
    <div style="font-size:14px;line-height:1.4;">${message}</div>
  `;

  container.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = "rqFadeOut 0.4s ease forwards";
    setTimeout(() => notif.remove(), 400);
  }, 6000);
}

export default NotificationListener;