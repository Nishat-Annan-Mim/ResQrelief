import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./NGORegister.css";

const AGENCY_TYPES = [
  "NGO",
  "Government",
  "UN Agency",
  "Red Cross/Crescent",
  "Hospital",
  "Military",
  "Community Org",
  "Other",
];

const RESOURCE_OPTIONS = [
  "Medical Supplies",
  "Food & Water",
  "Shelter",
  "Transport Vehicles",
  "Medical Personnel",
  "Rescue Equipment",
  "Communication Gear",
  "Financial Aid",
  "Volunteers",
  "Clothing",
];

const NGORegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    agencyName: "",
    agencyType: "",
    contactPerson: "",
    email: "",
    phone: "",
    district: "",
    registrationNumber: "",
    password: "",
    confirmPassword: "",
    resourcesAvailable: [],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleResource = (r) => {
    setForm((prev) => ({
      ...prev,
      resourcesAvailable: prev.resourcesAvailable.includes(r)
        ? prev.resourcesAvailable.filter((x) => x !== r)
        : [...prev.resourcesAvailable, r],
    }));
  };

  const handleSubmit = async () => {
    const { agencyName, agencyType, contactPerson, email, phone, district, password, confirmPassword } = form;
    if (!agencyName || !agencyType || !contactPerson || !email || !phone || !district || !password) {
      setMessage("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:3001/api/ngo/register", form);
      alert("Registration submitted! An admin will verify your agency shortly.");
      navigate("/collaboration-portal");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ngo-reg-page">
      <div className="ngo-reg-card">
        <div className="ngo-reg-hero">
          <h1>🤝 Register Your Agency</h1>
          <p>Join the ResQRelief Collaboration Network to coordinate relief efforts with other agencies.</p>
        </div>

        {message && <div className="ngo-reg-msg">{message}</div>}

        <div className="ngo-reg-grid">
          <div className="ngo-reg-field">
            <label>AGENCY NAME *</label>
            <input name="agencyName" value={form.agencyName} onChange={handleChange} placeholder="e.g. BRAC Relief Division" />
          </div>

          <div className="ngo-reg-field">
            <label>AGENCY TYPE *</label>
            <select name="agencyType" value={form.agencyType} onChange={handleChange}>
              <option value="">Select type</option>
              {AGENCY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="ngo-reg-field">
            <label>CONTACT PERSON *</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Full name of representative" />
          </div>

          <div className="ngo-reg-field">
            <label>EMAIL ADDRESS *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="agency@example.org" />
          </div>

          <div className="ngo-reg-field">
            <label>PHONE *</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+8801XXXXXXXXX" />
          </div>

          <div className="ngo-reg-field">
            <label>OPERATING DISTRICT *</label>
            <input name="district" value={form.district} onChange={handleChange} placeholder="e.g. Dhaka, Cox's Bazar" />
          </div>

          <div className="ngo-reg-field ngo-full">
            <label>REGISTRATION NUMBER (if any)</label>
            <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="Government or NGO Bureau registration number" />
          </div>

          <div className="ngo-reg-field">
            <label>PASSWORD *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" />
          </div>

          <div className="ngo-reg-field">
            <label>CONFIRM PASSWORD *</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
          </div>
        </div>

        <div className="ngo-resources-section">
          <label>RESOURCES AVAILABLE (select all that apply)</label>
          <div className="ngo-resources-grid">
            {RESOURCE_OPTIONS.map((r) => (
              <div
                key={r}
                className={`ngo-resource-chip ${form.resourcesAvailable.includes(r) ? "selected" : ""}`}
                onClick={() => toggleResource(r)}
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        <div className="ngo-reg-footer">
          <p className="ngo-reg-note">⚠️ Your registration will be reviewed by an admin before access is granted.</p>
          <button className="ngo-reg-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Registration →"}
          </button>
        </div>

        <p className="ngo-login-link">
          Already registered?{" "}
          <span onClick={() => navigate("/collaboration-portal")} className="ngo-link">
            Access the portal
          </span>
        </p>
      </div>
    </div>
  );
};

export default NGORegister;
