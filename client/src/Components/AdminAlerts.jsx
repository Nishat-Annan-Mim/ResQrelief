import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminAlerts.css";

const AdminAlerts = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState([]);
  const [channels, setChannels] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const toggle = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((i) => i !== value));
    } else {
      setList([...list, value]);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/alerts");
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
      await axios.post(
        "http://localhost:3001/api/alerts",
        {
          alertTitle: title,
          message,
          audience,
          channels,
        },
        {
          headers: { role: sessionStorage.getItem("role") },
        }
      );

      alert("✅ Alert Sent!");

      setTitle("");
      setMessage("");
      setAudience([]);
      setChannels([]);

      fetchAlerts(); // refresh table
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send alert");
    }
  };
  const expireAlert = async (id) => {
  try {
    await axios.patch(`http://localhost:3001/api/alerts/${id}/expire`);
    fetchAlerts(); // refresh the table
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
                  <td colSpan="5" style={{ textAlign: "center" }}>
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
                    <td>  {/* ← ADD THIS CELL */}
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
                        <span style={{ color: "#999", fontSize: "13px" }}>—</span>
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