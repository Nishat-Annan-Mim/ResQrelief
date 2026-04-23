import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminAlerts.css";

const AdminAlerts = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [district, setDistrict] = useState("");
  const [audience, setAudience] = useState([]);
  const [channels, setChannels] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const toggle = (value, list, setList) => {
    if (list.includes(value)) setList(list.filter((i) => i !== value));
    else setList([...list, value]);
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(
        "https://resqreliefcheck.onrender.com/api/alerts",
      );
      setAlerts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const sendAlert = async () => {
    try {
      const res = await axios.post(
        "https://resqreliefcheck.onrender.com/api/alerts",
        {
          alertTitle: title,
          message,
          audience,
          channels,
          // Pass district only when email channel is selected — used for tiered filtering
          district: channels.includes("email")
            ? district.trim() || undefined
            : undefined,
        },
        { headers: { role: sessionStorage.getItem("role") } },
      );

      const { emailsSent, inAppSent } = res.data;
      alert(
        `✅ Alert Sent!\n` +
          (channels.includes("email")
            ? `📧 Emails sent to ${emailsSent} recipient(s) (distance-based selection)\n`
            : "") +
          (channels.includes("app")
            ? `🔔 In-app notification sent to ${inAppSent} recipient(s)`
            : ""),
      );

      setTitle("");
      setMessage("");
      setDistrict("");
      setAudience([]);
      setChannels([]);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send alert");
    }
  };

  const expireAlert = async (id) => {
    try {
      await axios.patch(
        `https://resqreliefcheck.onrender.com/api/alerts/${id}/expire`,
      );
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert("❌ Could not expire alert");
    }
  };

  return (
    <div className="alert-page">
      <h1 className="main-title">Emergency Notification System</h1>

      <div className="alert-wrapper">
        {/* LEFT SIDE */}
        <div className="alert-form">
          <h2>Create Emergency Alert</h2>

          <label>Alert Title</label>
          <input
            placeholder="Enter alert title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Message</label>
          <textarea
            placeholder="Enter alert message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <label>
            District{" "}
            <span
              style={{ fontWeight: "normal", color: "#888", fontSize: "13px" }}
            >
              (used for proximity-based email targeting)
            </span>
          </label>
          <input
            placeholder="e.g. Dhaka, Sylhet, Chattogram..."
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
          {channels.includes("email") && (
            <p
              style={{
                fontSize: "12px",
                color: "#888",
                marginTop: "-8px",
                marginBottom: "8px",
              }}
            >
              💡 Volunteers within 50 km will all be emailed. Beyond 50 km, only
              the nearest volunteer will receive an email.
            </p>
          )}

          <label>Target Audience</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={audience.includes("volunteers")}
                onChange={() => toggle("volunteers", audience, setAudience)}
              />
              Volunteers
            </label>
            <label>
              <input
                type="checkbox"
                checked={audience.includes("beneficiaries")}
                onChange={() => toggle("beneficiaries", audience, setAudience)}
              />
              Beneficiaries
            </label>
          </div>

          <label>Notification Channel</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={channels.includes("app")}
                onChange={() => toggle("app", channels, setChannels)}
              />
              In-App
            </label>
            <label>
              <input
                type="checkbox"
                checked={channels.includes("email")}
                onChange={() => toggle("email", channels, setChannels)}
              />
              Email
            </label>
          </div>

          <button className="send-btn" onClick={sendAlert}>
            Send Alerts
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="alert-history">
          <h2>Sent Alerts</h2>

          <table>
            <thead>
              <tr>
                <th>Alert Title</th>
                <th>Channel</th>
                <th>Audience</th>
                <th>Date Sent</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No alerts sent yet
                  </td>
                </tr>
              ) : (
                alerts.map((a, index) => (
                  <tr key={index}>
                    <td>{a.alertTitle}</td>
                    <td>{a.channels.join(" + ")}</td>
                    <td>{a.audience.join(" + ")}</td>
                    <td>{new Date(a.dateSent).toLocaleDateString()}</td>
                    <td>{a.status}</td>
                    <td>
                      {a.status !== "expired" ? (
                        <button
                          onClick={() => expireAlert(a._id)}
                          style={{
                            background: "#c0392b",
                            color: "#fff",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          Expire
                        </button>
                      ) : (
                        <span style={{ color: "#999", fontSize: "13px" }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAlerts;
