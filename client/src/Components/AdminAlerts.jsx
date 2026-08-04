import React, { useState, useEffect } from "react";
import axios from "axios";
import { Megaphone, Send, History, Info } from "lucide-react";
import "./AdminAlerts.css";
import AdminLayout from "./AdminLayout";

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
        "https://resqrelief-fj7z.onrender.com/api/alerts",
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
        "https://resqrelief-fj7z.onrender.com/api/alerts",
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
        `Alert sent.\n` +
          (channels.includes("email")
            ? `Emails sent to ${emailsSent} recipient(s) (distance-based selection)\n`
            : "") +
          (channels.includes("app")
            ? `In-app notification sent to ${inAppSent} recipient(s)`
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
      alert("Failed to send alert.");
    }
  };

  const expireAlert = async (id) => {
    try {
      await axios.patch(
        `https://resqrelief-fj7z.onrender.com/api/alerts/${id}/expire`,
      );
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert("Could not expire alert.");
    }
  };

  return (
    <AdminLayout>
      <div className="alert-page">
        <h1 className="main-title">
          <Megaphone size={22} strokeWidth={1.75} />
          Emergency Notification System
        </h1>

        <div className="alert-wrapper">
          {/* LEFT SIDE */}
          <div className="alert-form">
            <h2>
              <Send size={17} strokeWidth={1.75} />
              Create Emergency Alert
            </h2>

            <div className="alert-form-body">
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
                  style={{ fontWeight: "normal", color: "#9ca3af", fontSize: "11px", textTransform: "none", letterSpacing: 0 }}
                >
                  (proximity-based email targeting)
                </span>
              </label>
              <input
                placeholder="e.g. Dhaka, Sylhet, Chattogram..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
              {channels.includes("email") && (
                <p className="proximity-hint">
                  <Info size={14} strokeWidth={2} />
                  <span>
                    Volunteers within 50 km will all be emailed. Beyond 50 km,
                    only the nearest volunteer will receive an email.
                  </span>
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
                <Send size={15} strokeWidth={2.25} />
                Send Alert
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="alert-history">
            <h2>
              <History size={17} strokeWidth={1.75} />
              Sent Alerts
            </h2>

            <table className="ad-stack">
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
                    <td colSpan="6" className="alert-empty">
                      No alerts sent yet
                    </td>
                  </tr>
                ) : (
                  alerts.map((a, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600, color: "#111827" }} data-label="Alert Title">{a.alertTitle}</td>
                      <td style={{ color: "#6b7280" }} data-label="Channel">{a.channels.join(" + ")}</td>
                      <td style={{ color: "#6b7280" }} data-label="Audience">{a.audience.join(" + ")}</td>
                      <td style={{ fontSize: "12px", color: "#9ca3af" }} data-label="Date Sent">{new Date(a.dateSent).toLocaleDateString()}</td>
                      <td data-label="Status">
                        <span
                          className={`alert-status-pill ${
                            a.status === "expired" ? "status-expired" : "status-active"
                          }`}
                        >
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </td>
                      <td data-label="Action">
                        {a.status !== "expired" ? (
                          <button
                            className="expire-btn"
                            onClick={() => expireAlert(a._id)}
                          >
                            Expire
                          </button>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "13px" }}>
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
    </AdminLayout>
  );
};

export default AdminAlerts;
