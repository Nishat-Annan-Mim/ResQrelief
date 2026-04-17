import { useEffect, useState } from "react";

export default function DonorImpact() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({
    impactSummary: "",
    servedArea: "",
    isUtilized: false,
    utilizedAmount: 0,
    impactImages: [],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/admin/donor-impact")
      .then((r) => r.json())
      .then((d) => { setDonations(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openEdit = (donation) => {
    setSelected(donation);
    setEditForm({
      impactSummary: donation.impactSummary || "",
      servedArea: donation.servedArea || "",
      isUtilized: donation.isUtilized || false,
      utilizedAmount: donation.utilizedAmount || 0,
      impactImages: donation.impactImages || [],
    });
    setImagePreview(donation.impactImages || []);
    setMessage("");
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview((prev) => [...prev, reader.result]);
        setEditForm((prev) => ({
          ...prev,
          impactImages: [...prev.impactImages, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setEditForm((prev) => ({
      ...prev,
      impactImages: prev.impactImages.filter((_, i) => i !== index),
    }));
  };

  const saveImpact = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `http://localhost:3001/admin/donor-impact/${selected._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setDonations((prev) =>
          prev.map((d) => (d._id === selected._id ? { ...d, ...editForm } : d))
        );
        setMessage("✅ Impact saved successfully!");
        setSelected(null);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("❌ Error saving impact");
    } finally {
      setSaving(false);
    }
  };

  const generateCertificate = async (donation) => {
    try {
      const res = await fetch(
        `http://localhost:3001/admin/donor-impact/${donation._id}/certificate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        const win = window.open("", "_blank");
        win.document.write(`
          <html>
          <head>
            <title>Donation Certificate</title>
            <style>
              body { font-family: 'Georgia', serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9f6f0; }
              .cert { border: 8px double #c8a96e; padding: 3rem; max-width: 700px; text-align: center; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
              h1 { color: #b8860b; font-size: 2rem; margin-bottom: 0.5rem; }
              h2 { color: #333; font-size: 1.5rem; margin: 1rem 0; }
              .donor { font-size: 1.8rem; font-weight: bold; color: #1a1a1a; margin: 1rem 0; }
              p { color: #555; line-height: 1.8; }
              .cert-id { font-size: 0.8rem; color: #999; margin-top: 2rem; }
              .logo { font-size: 2rem; margin-bottom: 1rem; }
              .seal { font-size: 3rem; margin: 1rem 0; }
              .images { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0; }
              .images img { width: 150px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #c8a96e; }
            </style>
          </head>
          <body>
            <div class="cert">
              <div class="logo">🆘 RESQRELIEF</div>
              <h1>Certificate of Appreciation</h1>
              <p>This is to certify that</p>
              <div class="donor">${donation.donorName}</div>
              <p>has made a generous donation of</p>
              <h2>${donation.donationType === "money"
                ? "৳" + donation.amount?.toLocaleString()
                : donation.supplies?.map((s) => s.item + " x" + s.quantity).join(", ")
              }</h2>
              <p>Your contribution has helped disaster-affected communities in Bangladesh.</p>
              ${donation.servedArea ? `<p><strong>Area Served:</strong> ${donation.servedArea}</p>` : ""}
              ${donation.impactSummary ? `<p><strong>Impact:</strong> ${donation.impactSummary}</p>` : ""}
              ${donation.impactImages && donation.impactImages.length > 0
                ? `<div class="images">${donation.impactImages.map((img) => `<img src="${img}" alt="impact"/>`).join("")}</div>`
                : ""}
              <div class="seal">🏅</div>
              <p>Issued on: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              <div class="cert-id">Certificate ID: ${data.certificateId}</div>
              <br/>
              <button onclick="window.print()" style="padding:0.7rem 2rem;background:#b8860b;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:1rem;">
                Download / Print
              </button>
            </div>
          </body>
          </html>
        `);
        win.document.close();
        setDonations((prev) =>
          prev.map((d) =>
            d._id === donation._id ? { ...d, certificateGenerated: true } : d
          )
        );
      }
    } catch {
      alert("Error generating certificate");
    }
  };

  const s = {
    fontFamily: "Segoe UI, sans-serif",
    padding: "2rem",
    maxWidth: "1000px",
    margin: "0 auto",
  };

  if (loading) return <div style={s}><p>Loading donor impact data...</p></div>;

  return (
    <div style={s}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.5rem" }}>
        🏅 Donor Impact Tracker
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Track how donations were used and generate certificates for donors.
      </p>

      {message && (
        <div style={{ padding: "0.8rem 1rem", borderRadius: "8px", backgroundColor: "#f0fff4", border: "1px solid #68d391", marginBottom: "1rem" }}>
          {message}
        </div>
      )}

      {/* Edit Impact Modal */}
      {selected && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, overflowY: "auto" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "540px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", margin: "2rem auto" }}>
            <h3 style={{ marginTop: 0 }}>Edit Impact for {selected.donorName}</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.4rem" }}>Impact Summary</label>
              <textarea
                value={editForm.impactSummary}
                onChange={(e) => setEditForm({ ...editForm, impactSummary: e.target.value })}
                rows={4}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1.5px solid #ddd", boxSizing: "border-box", fontSize: "0.9rem" }}
                placeholder="Describe how this donation was used..."
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.4rem" }}>Served Area</label>
              <input
                value={editForm.servedArea}
                onChange={(e) => setEditForm({ ...editForm, servedArea: e.target.value })}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1.5px solid #ddd", boxSizing: "border-box" }}
                placeholder="e.g. Sylhet, Cox's Bazar"
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.4rem" }}>Utilized Amount (৳)</label>
                <input
                  type="number"
                  value={editForm.utilizedAmount}
                  onChange={(e) => setEditForm({ ...editForm, utilizedAmount: Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1.5px solid #ddd", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                <input
                  type="checkbox"
                  checked={editForm.isUtilized}
                  onChange={(e) => setEditForm({ ...editForm, isUtilized: e.target.checked })}
                  id="isUtilized"
                />
                <label htmlFor="isUtilized" style={{ fontWeight: "600" }}>Fully Utilized</label>
              </div>
            </div>

            {/* ✅ Image Upload */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.4rem" }}>
                Impact Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ marginBottom: "0.8rem" }}
              />
              {imagePreview.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {imagePreview.map((img, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={img}
                        alt={`preview-${i}`}
                        style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1.5px solid #ddd" }}
                      />
                      <button
                        onClick={() => removeImage(i)}
                        style={{ position: "absolute", top: "-6px", right: "-6px", background: "#e63946", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={saveImpact}
                disabled={saving}
                style={{ flex: 1, padding: "0.8rem", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
              >
                {saving ? "Saving..." : "Save Impact"}
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{ flex: 1, padding: "0.8rem", backgroundColor: "#f0f0f0", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donations Table */}
      {donations.length === 0 ? (
        <p style={{ color: "#aaa" }}>No successful donations found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={th}>Donor</th>
                <th style={th}>Type</th>
                <th style={th}>Amount/Items</th>
                <th style={th}>Area</th>
                <th style={th}>Impact</th>
                <th style={th}>Images</th>
                <th style={th}>Certificate</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={td}>
                    <p style={{ margin: 0, fontWeight: "600" }}>{d.donorName}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>{d.donorEmail}</p>
                  </td>
                  <td style={td}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", backgroundColor: d.donationType === "money" ? "#e8f5e9" : "#e3f0ff", color: d.donationType === "money" ? "#2e7d32" : "#1565c0", fontWeight: "600", fontSize: "0.78rem" }}>
                      {d.donationType}
                    </span>
                  </td>
                  <td style={td}>
                    {d.donationType === "money"
                      ? `৳${d.amount?.toLocaleString()}`
                      : d.supplies?.map((s) => `${s.item} x${s.quantity}`).join(", ")}
                  </td>
                  <td style={td}>{d.servedArea || <span style={{ color: "#ccc" }}>—</span>}</td>
                  <td style={td}>
                    {d.impactSummary
                      ? <span style={{ color: "#2e7d32" }}>✅ Added</span>
                      : <span style={{ color: "#f57f17" }}>⏳ Pending</span>}
                  </td>
                  <td style={td}>
                    {d.impactImages && d.impactImages.length > 0
                      ? <span style={{ color: "#2e7d32" }}>🖼️ {d.impactImages.length}</span>
                      : <span style={{ color: "#ccc" }}>—</span>}
                  </td>
                  <td style={td}>
                    {d.certificateGenerated
                      ? <span style={{ color: "#2e7d32" }}>✅ Issued</span>
                      : <span style={{ color: "#aaa" }}>Not issued</span>}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => openEdit(d)}
                        style={{ padding: "0.3rem 0.7rem", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem" }}
                      >
                        Edit Impact
                      </button>
                      <button
                        onClick={() => generateCertificate(d)}
                        style={{ padding: "0.3rem 0.7rem", backgroundColor: "#b8860b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem" }}
                      >
                        {d.certificateGenerated ? "Re-issue" : "Generate Cert"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { padding: "0.7rem 1rem", textAlign: "left", fontWeight: "600", color: "#444", whiteSpace: "nowrap" };
const td = { padding: "0.65rem 1rem", color: "#333", verticalAlign: "middle" };