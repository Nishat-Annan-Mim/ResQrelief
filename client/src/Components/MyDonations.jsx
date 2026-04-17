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

  const downloadCertificate = (donation) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Donation Certificate</title>
        <style>
          body { font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9f6f0; }
          .cert { border: 8px double #c8a96e; padding: 3rem; max-width: 700px; text-align: center; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
          h1 { color: #b8860b; font-size: 2rem; margin-bottom: 0.5rem; }
          h2 { color: #333; font-size: 1.5rem; margin: 1rem 0; }
          .donor { font-size: 1.8rem; font-weight: bold; color: #1a1a1a; margin: 1rem 0; }
          p { color: #555; line-height: 1.8; }
          .cert-id { font-size: 0.8rem; color: #999; margin-top: 2rem; }
          .seal { font-size: 3rem; margin: 1rem 0; }
          .images { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0; }
          .images img { width: 150px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #c8a96e; }
        </style>
      </head>
      <body>
        <div class="cert">
          <div style="font-size:2rem;margin-bottom:1rem;">🆘 RESQRELIEF</div>
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
          <p>Issued on: ${new Date(donation.certificateData?.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          <div class="cert-id">Certificate ID: ${donation.certificateData?.certificateId}</div>
          <br/>
          <button onclick="window.print()" style="padding:0.7rem 2rem;background:#b8860b;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:1rem;">
            Download / Print
          </button>
        </div>
      </body>
      </html>
    `);
    win.document.close();
  };

  const s = {
    fontFamily: "Segoe UI, sans-serif",
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
  };

  if (!email) return (
    <div style={s}><p>Please log in to view your donations.</p></div>
  );

  if (loading) return (
    <div style={s}><p>Loading your donations...</p></div>
  );

  return (
    <div style={s}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.5rem" }}>
        💝 My Donations
      </h1>
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
                  <p style={{ margin: 0, color: "#555", fontSize: "0.9rem", lineHeight: "1.6" }}>
                    {d.impactSummary}
                  </p>
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
                    🏅 Download Certificate
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