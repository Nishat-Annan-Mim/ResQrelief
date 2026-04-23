import React, { useEffect, useState } from "react";
import axios from "axios";

const UserAlerts = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [expiredAlerts, setExpiredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(
          "https://resqreliefcheck.onrender.com/api/alerts",
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
  if (loading) return <p style={{ padding: "40px" }}>Loading alerts...</p>;

  const renderAlert = (alert, expired = false) => (
    <div
      key={alert._id}
      style={{
        borderLeft: `4px solid ${expired ? "#bbb" : "#c0392b"}`,
        background: expired ? "#f5f5f5" : "#fdf2f2",
        padding: "15px",
        marginBottom: "15px",
        borderRadius: "4px",
        opacity: expired ? 0.6 : 1,
      }}
    >
      <h3 style={{ margin: "0 0 6px 0", color: expired ? "#999" : "#c0392b" }}>
        {expired ? "🔕" : "🚨"} {alert.alertTitle}
        {expired && (
          <span
            style={{
              fontSize: "11px",
              marginLeft: "10px",
              background: "#ddd",
              color: "#666",
              padding: "2px 8px",
              borderRadius: "10px",
              fontWeight: "normal",
            }}
          >
            Expired
          </span>
        )}
      </h3>
      <p style={{ margin: 0, color: expired ? "#aaa" : "inherit" }}>
        {alert.message}
      </p>
      <small style={{ color: "#aaa", display: "block", marginTop: "8px" }}>
        {new Date(alert.dateSent).toLocaleString()}
      </small>
    </div>
  );

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Important Alerts</h2>

      {activeAlerts.length === 0 && expiredAlerts.length === 0 ? (
        <p>You have no alerts.</p>
      ) : (
        <>
          {activeAlerts.length === 0 && (
            <p style={{ color: "#999" }}>No active alerts right now.</p>
          )}
          {activeAlerts.map((a) => renderAlert(a, false))}

          {expiredAlerts.length > 0 && (
            <>
              <hr style={{ margin: "30px 0", borderColor: "#eee" }} />
              <p
                style={{
                  color: "#aaa",
                  fontSize: "13px",
                  marginBottom: "15px",
                }}
              >
                Past / Expired Alerts
              </p>
              {expiredAlerts.map((a) => renderAlert(a, true))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserAlerts;
