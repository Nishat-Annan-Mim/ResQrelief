import { useEffect, useState } from "react";

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const email = user?.email;

  useEffect(() => {
    if (!email) return;
    fetch(`http://localhost:3001/my-donations/${email}`)
      .then((r) => r.json())
      .then((d) => { setDonations(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [email]);

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

  const s = {
    fontFamily: "Segoe UI, sans-serif",
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
  };

  if (!email) return <div style={s}><p>Please log in to view your donations.</p></div>;
  if (loading) return <div style={s}><p>Loading your donations...</p></div>;

  return (
    <div style={s}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.5rem" }}>💝 My Donations</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        View your donation history, impact summaries and download your certificates.
      </p>

      {donations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: "3rem", margin: 0 }}>💳</p>
          <h3>No donations yet</h3>
          <p style={{ color: "#888" }}>Your donation history will appear here once you make a donation.</p>
          <a href="/donate" style={{ display: "inline-block", marginTop: "1rem", padding: "0.8rem 2rem", backgroundColor: "#e63946", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: "600" }}>
            Make a Donation
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {donations.map((d) => (
            <div key={d._id} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #f0f0f0" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ padding: "0.2rem 0.7rem", borderRadius: "12px", backgroundColor: d.donationType === "money" ? "#e8f5e9" : "#e3f0ff", color: d.donationType === "money" ? "#2e7d32" : "#1565c0", fontWeight: "600", fontSize: "0.82rem" }}>
                      {d.donationType === "money" ? "💰 Money" : "📦 Supplies"}
                    </span>
                    <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1a1a1a" }}>
                      {d.donationType === "money"
                        ? `৳${d.amount?.toLocaleString()}`
                        : d.supplies?.map((s) => `${s.item} x${s.quantity}`).join(", ")}
                    </span>
                  </div>
                  <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.82rem", color: "#888" }}>
                    {new Date(d.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {d.transactionId && ` · TXN: ${d.transactionId}`}
                  </p>
                </div>
                <span style={{ padding: "0.3rem 0.8rem", borderRadius: "12px", backgroundColor: "#e8f5e9", color: "#2e7d32", fontWeight: "600", fontSize: "0.82rem" }}>
                  ✅ Successful
                </span>
              </div>

              {/* Impact Section */}
              {d.impactSummary ? (
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", fontSize: "0.9rem", color: "#1a1a1a" }}>
                    🌍 How your donation was used:
                  </p>
                  <p style={{ margin: 0, color: "#555", fontSize: "0.9rem", lineHeight: "1.6" }}>{d.impactSummary}</p>
                  {d.servedArea && (
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.82rem", color: "#888" }}>
                      📍 Area served: <strong>{d.servedArea}</strong>
                    </p>
                  )}
                  {d.isUtilized && d.utilizedAmount > 0 && (
                    <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.82rem", color: "#888" }}>
                      💵 Amount utilized: <strong>৳{d.utilizedAmount?.toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ backgroundColor: "#fff8e1", borderRadius: "10px", padding: "0.8rem 1rem", marginBottom: "1rem" }}>
                  <p style={{ margin: 0, color: "#f57f17", fontSize: "0.88rem" }}>
                    ⏳ Impact report is being prepared by the admin. Check back soon.
                  </p>
                </div>
              )}

              {/* Impact Images */}
              {d.impactImages && d.impactImages.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", fontSize: "0.88rem" }}>📸 Impact Photos:</p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {d.impactImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`impact-${i}`}
                        style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1.5px solid #ddd" }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {d.certificateGenerated ? (
                  <button
                    onClick={() => downloadCertificate(d)}
                    style={{ padding: "0.6rem 1.2rem", backgroundColor: "#b8860b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.88rem" }}
                  >
                    🏅 Download Certificate (PDF)
                  </button>
                ) : (
                  <span style={{ fontSize: "0.82rem", color: "#aaa", alignSelf: "center" }}>
                    Certificate not yet issued
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}