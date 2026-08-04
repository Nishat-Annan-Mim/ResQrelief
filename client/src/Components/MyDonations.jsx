import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Wallet,
  Package,
  CircleCheck,
  Globe,
  MapPin,
  Banknote,
  Hourglass,
  Camera,
  Award,
  CreditCard,
} from "lucide-react";
import "./MyDonations.css";

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const email = user?.email;

  useEffect(() => {
    if (!email) return;
    fetch(`https://resqrelief-fj7z.onrender.com/my-donations/${email}`)
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

  if (!email)
    return <p className="md-state">Please log in to view your donations.</p>;
  if (loading) return <p className="md-state">Loading your donations…</p>;

  return (
    <div className="md-page">
      <h1 className="md-title">
        <HeartHandshake size={22} strokeWidth={1.75} />
        My Donations
      </h1>
      <p className="md-subtitle">
        View your donation history, impact summaries and download your
        certificates.
      </p>

      {donations.length === 0 ? (
        <div className="md-empty">
          <CreditCard size={44} strokeWidth={1.5} />
          <h3>No donations yet</h3>
          <p>
            Your donation history will appear here once you make a donation.
          </p>
          <a href="/donate" className="md-empty-cta">
            <HeartHandshake size={15} strokeWidth={2} />
            Make a Donation
          </a>
        </div>
      ) : (
        <div className="md-list">
          {donations.map((d) => (
            <div key={d._id} className="md-card">
              {/* Header */}
              <div className="md-card-head">
                <div>
                  <div className="md-card-headline">
                    <span
                      className={`ad-pill ${
                        d.donationType === "money"
                          ? "ad-pill-success"
                          : "ad-pill-info"
                      }`}
                    >
                      {d.donationType === "money" ? (
                        <Wallet size={13} strokeWidth={2} />
                      ) : (
                        <Package size={13} strokeWidth={2} />
                      )}
                      {d.donationType === "money" ? "Money" : "Supplies"}
                    </span>
                    <span className="md-amount">
                      {d.donationType === "money"
                        ? `৳${d.amount?.toLocaleString()}`
                        : d.supplies
                            ?.map((s) => `${s.item} x${s.quantity}`)
                            .join(", ")}
                    </span>
                  </div>
                  <p className="md-meta">
                    {new Date(d.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {d.transactionId && ` · TXN: ${d.transactionId}`}
                  </p>
                </div>
                <span className="ad-pill ad-pill-success">
                  <CircleCheck size={13} strokeWidth={2} />
                  Successful
                </span>
              </div>

              {/* Impact */}
              {d.impactSummary ? (
                <div className="md-impact">
                  <p className="md-impact-title">
                    <Globe size={14} strokeWidth={2} />
                    How your donation was used
                  </p>
                  <p className="md-impact-body">{d.impactSummary}</p>
                  {d.servedArea && (
                    <p className="md-impact-line">
                      <MapPin size={13} strokeWidth={2} />
                      Area served: <strong>{d.servedArea}</strong>
                    </p>
                  )}
                  {d.isUtilized && d.utilizedAmount > 0 && (
                    <p className="md-impact-line">
                      <Banknote size={13} strokeWidth={2} />
                      Amount utilized:{" "}
                      <strong>৳{d.utilizedAmount?.toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="md-pending">
                  <Hourglass size={15} strokeWidth={2} />
                  Impact report is being prepared by the admin. Check back soon.
                </div>
              )}

              {/* Impact photos */}
              {d.impactImages && d.impactImages.length > 0 && (
                <div className="md-photos">
                  <p className="md-photos-title">
                    <Camera size={14} strokeWidth={2} />
                    Impact Photos
                  </p>
                  <div className="md-photo-grid">
                    {d.impactImages.map((img, i) => (
                      <img key={i} src={img} alt={`impact-${i}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate */}
              <div className="md-cert-row">
                {d.certificateGenerated ? (
                  <button
                    className="md-cert-btn"
                    onClick={() => downloadCertificate(d)}
                  >
                    <Award size={15} strokeWidth={2} />
                    Download Certificate (PDF)
                  </button>
                ) : (
                  <span className="md-cert-none">
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
