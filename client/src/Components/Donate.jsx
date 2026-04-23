import { useState } from "react";
import "./Donate.css";

export default function Donate() {
  const [view, setView] = useState("home");
  return (
    <div className="donate-wrapper">
      {view === "home" && <DonateHome setView={setView} />}
      {view === "money" && <DonateMoney setView={setView} />}
      {view === "supplies" && <DonateSupplies setView={setView} />}
    </div>
  );
}

function DonateHome({ setView }) {
  return (
    <div className="donate-home">
      <div className="donate-hero">
        <h1>Make a Difference Today</h1>
        <p>Your support reaches disaster-affected communities directly.</p>
      </div>
      <div className="donate-options">
        <div className="donate-option-card" onClick={() => setView("money")}>
          <div className="option-icon">💳</div>
          <h2>Donate Money</h2>
          <p>Send funds securely via SSLCommerz. Every taka counts.</p>
          <button className="btn-primary">Donate Now →</button>
        </div>
        <div className="donate-option-card" onClick={() => setView("supplies")}>
          <div className="option-icon">📦</div>
          <h2>Schedule Drop-Off</h2>
          <p>Donate food, clothes, medicine, or blankets at a relief point.</p>
          <button className="btn-secondary">Schedule Drop-Off →</button>
        </div>
      </div>
    </div>
  );
}

function DonateMoney({ setView }) {
  const [form, setForm] = useState({
    donorName: "", donorEmail: "", donorPhone: "", donorAddress: "", amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const presets = [100, 250, 500, 1000, 2500, 5000];
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    if (!form.donorName || !form.donorEmail || !form.donorPhone || !form.amount) {
      setError("Please fill in all required fields.");
      return;
    }
    if (Number(form.amount) < 10) {
      setError("Minimum donation is 10 BDT.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://resqreliefcheck.onrender.com/donate/money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        setError(data.message || "Payment initiation failed.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-form-page">
      <button className="back-btn" onClick={() => setView("home")}>← Back</button>
      <h2>💳 Donate Money</h2>
      <p className="form-subtitle">Secure payment powered by SSLCommerz</p>
      <div className="form-group">
        <label>Full Name *</label>
        <input name="donorName" value={form.donorName} onChange={handleChange} placeholder="Your name" />
      </div>
      <div className="form-group">
        <label>Email *</label>
        <input name="donorEmail" type="email" value={form.donorEmail} onChange={handleChange} placeholder="you@email.com" />
      </div>
      <div className="form-group">
        <label>Phone *</label>
        <input name="donorPhone" value={form.donorPhone} onChange={handleChange} placeholder="01XXXXXXXXX" />
      </div>
      <div className="form-group">
        <label>Address</label>
        <input name="donorAddress" value={form.donorAddress} onChange={handleChange} placeholder="Your address (optional)" />
      </div>
      <div className="form-group">
        <label>Donation Amount (BDT) *</label>
        <div className="preset-amounts">
          {presets.map((p) => (
            <button key={p} className={`preset-btn ${Number(form.amount) === p ? "active" : ""}`} onClick={() => setForm({ ...form, amount: String(p) })}>
              ৳{p}
            </button>
          ))}
        </div>
        <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Or enter custom amount" min="10" />
      </div>
      {error && <div className="error-msg">⚠️ {error}</div>}
      <button className="btn-primary submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Redirecting to payment..." : `Pay ৳${form.amount || "0"} via SSLCommerz`}
      </button>
      <p className="ssl-note">🔒 Secured by SSLCommerz · Visa · MasterCard · bKash · Nagad</p>
    </div>
  );
}

function DonateSupplies({ setView }) {
  const [formData, setFormData] = useState({
    donorName: "", donorEmail: "", donorPhone: "",
    category: "", quantity: "", unit: "pcs",
    dropLocation: "", dropDate: "", dropTime: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categoryOptions = ["food", "clothes", "medicine", "blankets"];
  const locationOptions = ["Dhaka Relief Center", "Chittagong Warehouse", "Sylhet Collection Point", "Barishal Hub"];
  const isFormComplete = Object.values(formData).every((val) => String(val).trim() !== "");

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("https://resqreliefcheck.onrender.com/donate/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: formData.donorName,
          donorEmail: formData.donorEmail,
          donorPhone: formData.donorPhone,
          donorAddress: "",
          supplies: [{ item: formData.category, quantity: Number(formData.quantity), unit: formData.unit }],
          dropOffDate: formData.dropDate,
          dropOffLocation: formData.dropLocation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setMessage(data.message || "Error submitting form");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error submitting form");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="donate-success">
        <div className="success-icon">✅</div>
        <h2>Drop-Off Scheduled!</h2>
        <p>Thank you! Your supply donation has been registered.</p>
        <button className="btn-primary" onClick={() => setView("home")}>Back to Donate</button>
      </div>
    );
  }

  return (
    <div className="donate-form-page">
      <button className="back-btn" onClick={() => setView("home")}>← Back</button>
      <h2>📦 Schedule Supply Drop-Off</h2>
      <p className="form-subtitle">Donate essential supplies to relief centers</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input name="donorName" value={formData.donorName} onChange={handleChange} placeholder="Your name" />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input name="donorEmail" type="email" value={formData.donorEmail} onChange={handleChange} placeholder="you@email.com" />
        </div>
        <div className="form-group">
          <label>Phone *</label>
          <input name="donorPhone" value={formData.donorPhone} onChange={handleChange} placeholder="01XXXXXXXXX" />
        </div>
        <div className="form-group">
          <label>Donation Category *</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">-- Select Category --</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity *</label>
          <div className="qty-unit-row">
            <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="e.g. 10" min="1" className="qty-input" />
            <select name="unit" value={formData.unit} onChange={handleChange} className="unit-select">
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="litre">litre</option>
              <option value="box">box</option>
              <option value="packet">packet</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Drop-Off Location *</label>
          <select name="dropLocation" value={formData.dropLocation} onChange={handleChange}>
            <option value="">-- Select Location --</option>
            {locationOptions.map((l) => (<option key={l} value={l}>{l}</option>))}
          </select>
        </div>
        <div className="form-group">
          <label>Drop-Off Date *</label>
          <input name="dropDate" type="date" value={formData.dropDate} onChange={handleChange} min={new Date().toISOString().split("T")[0]} />
        </div>
        <div className="form-group">
          <label>Drop-Off Time *</label>
          <input name="dropTime" type="time" value={formData.dropTime} onChange={handleChange} />
        </div>
        {message && <div className="error-msg" style={{ marginBottom: "0.8rem" }}>⚠️ {message}</div>}
        <button type="submit" className="btn-secondary submit-btn" style={{ opacity: isFormComplete ? 1 : 0.5, cursor: isFormComplete ? "pointer" : "not-allowed" }} disabled={!isFormComplete || loading}>
          {loading ? "Scheduling..." : "Confirm Drop-Off"}
        </button>
      </form>
    </div>
  );
}

