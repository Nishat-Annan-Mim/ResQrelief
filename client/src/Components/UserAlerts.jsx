import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bell, BellRing, BellOff } from "lucide-react";
import "./UserAlerts.css";

const UserAlerts = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [expiredAlerts, setExpiredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(
          "https://resqrelief-fj7z.onrender.com/api/alerts",
        );

        const sorted = res.data
          .sort((a, b) => new Date(b.dateSent) - new Date(a.dateSent))
          .slice(0, 30);

        setActiveAlerts(sorted.filter((a) => a.status !== "expired"));
        setExpiredAlerts(sorted.filter((a) => a.status === "expired"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) return <p className="ua-state">Loading alerts…</p>;

  const renderAlert = (alert, expired = false) => (
    <div
      key={alert._id}
      className={`ua-alert ${expired ? "ua-alert--expired" : ""}`}
    >
      <h3 className="ua-alert-title">
        {expired ? (
          <BellOff size={16} strokeWidth={2} />
        ) : (
          <BellRing size={16} strokeWidth={2} />
        )}
        {alert.alertTitle}
        {expired && <span className="ad-pill ad-pill-neutral">Expired</span>}
      </h3>
      <p className="ua-alert-message">{alert.message}</p>
      <small className="ua-alert-time">
        {new Date(alert.dateSent).toLocaleString()}
      </small>
    </div>
  );

  return (
    <div className="ua-page">
      <h2 className="ua-title">
        <Bell size={22} strokeWidth={1.75} />
        Important Alerts
      </h2>

      {activeAlerts.length === 0 && expiredAlerts.length === 0 ? (
        <p className="ua-empty">You have no alerts.</p>
      ) : (
        <>
          {activeAlerts.length === 0 && (
            <p className="ua-note">No active alerts right now.</p>
          )}
          {activeAlerts.map((a) => renderAlert(a, false))}

          {expiredAlerts.length > 0 && (
            <>
              <hr className="ua-divider" />
              <p className="ua-note">Past / Expired Alerts</p>
              {expiredAlerts.map((a) => renderAlert(a, true))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserAlerts;
