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

  const downloadCertificate = async (donation) => {
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(249, 246, 240);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Outer border
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(3);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner border
    doc.setLineWidth(1);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Gold header bar
    doc.setFillColor(200, 169, 110);
    doc.rect(12, 12, pageWidth - 24, 18, "F");

    // Organization name in header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("RESQRELIEF — Disaster Relief Organization", pageWidth / 2, 23, { align: "center" });

    // Certificate title
    doc.setTextColor(184, 134, 11);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Certificate of Appreciation", pageWidth / 2, 48, { align: "center" });

    // Decorative line
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.8);
    doc.line(40, 53, pageWidth - 40, 53);

    // Subtitle
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("This is to proudly certify that", pageWidth / 2, 63, { align: "center" });

    // Donor name
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(donation.donorName, pageWidth / 2, 78, { align: "center" });

    // Underline donor name
    const nameWidth = doc.getTextWidth(donation.donorName);
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - nameWidth / 2, 81, pageWidth / 2 + nameWidth / 2, 81);

    // Donation text
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("has made a generous donation of", pageWidth / 2, 91, { align: "center" });

    // Donation amount
    const donationValue = donation.donationType === "money"
      ? `BDT ${donation.amount?.toLocaleString()}`
      : donation.supplies?.map((s) => `${s.item} x${s.quantity}`).join(", ");

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(donationValue, pageWidth / 2, 101, { align: "center" });

    // Impact message
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Your generous contribution has made a meaningful difference to disaster-affected communities in Bangladesh.",
      pageWidth / 2, 113, { align: "center", maxWidth: pageWidth - 80 }
    );

    // Served area
    if (donation.servedArea) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 26, 26);
      doc.text("Area Served: ", pageWidth / 2 - 30, 124);
      doc.setFont("helvetica", "normal");
      doc.text(donation.servedArea, pageWidth / 2 + 10, 124);
    }

    // Impact summary
    if (donation.impactSummary) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      doc.text(
        `"${donation.impactSummary}"`,
        pageWidth / 2, 133,
        { align: "center", maxWidth: pageWidth - 80 }
      );
    }

    // Seal
    doc.setFontSize(24);
    doc.setTextColor(200, 169, 110);
    doc.setFont("helvetica", "bold");
    doc.text("★ ★ ★", pageWidth / 2, 148, { align: "center" });

    // Decorative line above footer
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.8);
    doc.line(40, 155, pageWidth - 40, 155);

    // Issue date
    const issueDate = donation.certificateData?.issuedAt
      ? new Date(donation.certificateData.issuedAt).toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Date of Issue: ${issueDate}`, 40, 163);

    // Certificate ID
    if (donation.certificateData?.certificateId) {
      doc.text(
        `Certificate ID: ${donation.certificateData.certificateId}`,
        pageWidth - 40, 163,
        { align: "right" }
      );
    }

    // Transaction ID
    if (donation.transactionId) {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Transaction ID: ${donation.transactionId}`,
        pageWidth / 2, 170,
        { align: "center" }
      );
    }

    doc.save(`RESQRELIEF-Certificate-${donation.donorName}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const generateCertificate = async (donation) => {
    try {
      const res = await fetch(
        `http://localhost:3001/admin/donor-impact/${donation._id}/certificate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        const updatedDonation = {
          ...donation,
          certificateData: {
            certificateId: data.certificateId,
            issuedAt: new Date(),
          },
          certificateGenerated: true,
        };
        await downloadCertificate(updatedDonation);
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

            {/* Image Upload */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.4rem" }}>Impact Images</label>
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