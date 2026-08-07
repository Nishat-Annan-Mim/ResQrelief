import { useEffect, useState } from "react";
import {
  Award,
  X,
  CircleCheck,
  Hourglass,
  Pencil,
  FileBadge,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import "./DonorImpact.css";
import AdminLayout from "./AdminLayout";
import { api, BASE_URL } from "../api";

const CERTIFICATE_MIN_AMOUNT = 1000; // ADD: keep in sync with backend threshold

/**
 * Turns a failed response into something a human can act on.
 * Express returns HTML (not JSON) for 413/404, so blindly calling res.json()
 * throws and hides the real status behind a generic "Error saving" message.
 */
async function describeError(res) {
  if (res.status === 413)
    return "Images are too large. Try fewer or smaller photos.";
  try {
    const text = await res.text();
    try {
      return JSON.parse(text).message || text.slice(0, 120);
    } catch {
      return `${res.status} ${res.statusText}`;
    }
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

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
    fetch(api("/admin/donor-impact"))
      .then((r) => r.json())
      .then((d) => {
        setDonations(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ADD: eligibility check — money donations need to meet the threshold; supplies are unaffected
  const isCertEligible = (donation) =>
    donation.donationType === "money"
      ? (donation.amount || 0) >= CERTIFICATE_MIN_AMOUNT
      : true;

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
        api(`/admin/donor-impact/${selected._id}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );
      // FIX: a 413 (payload too large) or a 404 returns HTML, not JSON, so
      // res.json() threw and the real status was lost inside the catch.
      // Read the status first, and only parse JSON when the body actually is.
      if (!res.ok) {
        setMessage(`Save failed: ${await describeError(res)}`);
        return;
      }

      await res.json();
      setDonations((prev) =>
        prev.map((d) => (d._id === selected._id ? { ...d, ...editForm } : d)),
      );
      setMessage("Impact saved successfully.");
      setSelected(null);
    } catch (err) {
      // A genuine network failure (server not running, wrong port, CORS).
      console.error("Save impact failed:", err);
      setMessage(
        `Could not reach the server (${BASE_URL}). Is the backend running? — ${err.message}`,
      );
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
    doc.text("RESQRELIEF — Disaster Relief Organization", pageWidth / 2, 23, {
      align: "center",
    });

    // Certificate title
    doc.setTextColor(184, 134, 11);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Certificate of Appreciation", pageWidth / 2, 48, {
      align: "center",
    });

    // Decorative line
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.8);
    doc.line(40, 53, pageWidth - 40, 53);

    // Subtitle
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("This is to proudly certify that", pageWidth / 2, 63, {
      align: "center",
    });

    // Donor name
    // FIX: anonymous/legacy donations can have no donorName, and both
    // doc.text() and doc.getTextWidth() throw on undefined.
    const donorName = donation.donorName || "Anonymous Donor";

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(donorName, pageWidth / 2, 78, { align: "center" });

    // Underline donor name
    const nameWidth = doc.getTextWidth(donorName);
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.5);
    doc.line(
      pageWidth / 2 - nameWidth / 2,
      81,
      pageWidth / 2 + nameWidth / 2,
      81,
    );

    // Donation text
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("has made a generous donation of", pageWidth / 2, 91, {
      align: "center",
    });

    // Donation amount
    // FIX: both branches could yield undefined — a supply donation with no
    // `supplies` array, or a money donation with no `amount`. jsPDF throws on
    // doc.text(undefined, ...), which the caller's bare catch turned into a
    // useless "Error generating certificate" alert. Always end up with a string.
    const donationValue =
      donation.donationType === "money"
        ? `BDT ${(donation.amount || 0).toLocaleString()}`
        : donation.supplies?.length
          ? donation.supplies
              .map((s) => `${s.item} x${s.quantity}`)
              .join(", ")
          : "Donated supplies";

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
      pageWidth / 2,
      113,
      { align: "center", maxWidth: pageWidth - 80 },
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
      doc.text(`"${donation.impactSummary}"`, pageWidth / 2, 133, {
        align: "center",
        maxWidth: pageWidth - 80,
      });
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
      ? new Date(donation.certificateData.issuedAt).toLocaleDateString(
          "en-GB",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        )
      : new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Date of Issue: ${issueDate}`, 40, 163);

    // Certificate ID
    if (donation.certificateData?.certificateId) {
      doc.text(
        `Certificate ID: ${donation.certificateData.certificateId}`,
        pageWidth - 40,
        163,
        { align: "right" },
      );
    }

    // Transaction ID
    if (donation.transactionId) {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Transaction ID: ${donation.transactionId}`,
        pageWidth / 2,
        170,
        { align: "center" },
      );
    }

    doc.save(
      `RESQRELIEF-Certificate-${donorName}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const generateCertificate = async (donation) => {
    // ADD: client-side guard so we never even fire the request when ineligible
    if (!isCertEligible(donation)) {
      setMessage(
        `Certificates are only issued for money donations of ৳${CERTIFICATE_MIN_AMOUNT} or more.`,
      );
      return;
    }
    try {
      const res = await fetch(
        api(`/admin/donor-impact/${donation._id}/certificate`),
        { method: "POST" },
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
            d._id === donation._id ? { ...d, certificateGenerated: true } : d,
          ),
        );
      } else {
        // ADD: surface backend rejection (e.g. threshold not met) instead of silently failing
        setMessage(data.message || "Error generating certificate");
      }
    } catch (err) {
      // FIX: the old bare `catch {}` threw away the real reason and always
      // showed the same alert, so a PDF-generation crash looked identical to
      // a network failure. Log the actual error and show what went wrong.
      console.error("Certificate generation failed:", err);
      setMessage(`Certificate failed: ${err.message}`);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="di-state">Loading donor impact data…</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="di-page">
        <div className="di-container">
          <h1 className="di-title">
            <Award size={22} strokeWidth={1.75} />
            Donor Impact Tracker
          </h1>
          <p className="di-subtitle">
            Track how donations were used and generate certificates for donors.
            Certificates require a money donation of ৳{CERTIFICATE_MIN_AMOUNT} or more.
          </p>

          {message && (
            <div className="di-message">
              <CircleCheck size={15} strokeWidth={2} />
              {message}
            </div>
          )}

          {/* ── Edit Impact Modal ── */}
          {selected && (
            <div className="di-modal-overlay">
              <div className="di-modal">
                <h3 className="di-modal-title">
                  <Pencil size={18} strokeWidth={1.75} />
                  Edit Impact for {selected.donorName}
                </h3>

                <div className="di-field">
                  <label>Impact Summary</label>
                  <textarea
                    value={editForm.impactSummary}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        impactSummary: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Describe how this donation was used…"
                  />
                </div>

                <div className="di-field">
                  <label>Served Area</label>
                  <input
                    value={editForm.servedArea}
                    onChange={(e) =>
                      setEditForm({ ...editForm, servedArea: e.target.value })
                    }
                    placeholder="e.g. Sylhet, Cox's Bazar"
                  />
                </div>

                <div className="di-field-row">
                  <div className="di-field">
                    <label>Utilized Amount (৳)</label>
                    <input
                      type="number"
                      value={editForm.utilizedAmount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          utilizedAmount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="di-checkbox">
                    <input
                      type="checkbox"
                      checked={editForm.isUtilized}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isUtilized: e.target.checked,
                        })
                      }
                      id="isUtilized"
                    />
                    <label htmlFor="isUtilized">Fully Utilized</label>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="di-field">
                  <label>Impact Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ marginBottom: "10px" }}
                  />
                  {imagePreview.length > 0 && (
                    <div className="di-previews">
                      {imagePreview.map((img, i) => (
                        <div key={i} className="di-preview">
                          <img src={img} alt={`preview-${i}`} />
                          <button
                            className="di-preview-remove"
                            onClick={() => removeImage(i)}
                            aria-label="Remove image"
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="di-modal-actions">
                  <button
                    className="di-btn di-btn-ghost"
                    onClick={() => setSelected(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="di-btn di-btn-primary"
                    onClick={saveImpact}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Impact"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Donations Table ── */}
          {donations.length === 0 ? (
            <p className="di-empty">No successful donations found.</p>
          ) : (
            <div className="di-card">
              <div className="di-table-wrap">
                <table className="di-table ad-stack">
                  <thead>
                    <tr>
                      <th>Donor</th>
                      <th>Type</th>
                      <th>Amount / Items</th>
                      <th>Area</th>
                      <th>Impact</th>
                      <th>Images</th>
                      <th>Certificate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => {
                      const eligible = isCertEligible(d); // ADD
                      return (
                        <tr key={d._id}>
                          <td data-label="Donor">
                            <p className="di-donor-name">{d.donorName}</p>
                            <p className="di-donor-email">{d.donorEmail}</p>
                          </td>
                          <td data-label="Type">
                            <span
                              className={`ad-pill ${
                                d.donationType === "money"
                                  ? "ad-pill-success"
                                  : "ad-pill-info"
                              }`}
                            >
                              {d.donationType}
                            </span>
                          </td>
                          <td data-label="Amount / Items">
                            {d.donationType === "money"
                              ? `৳${d.amount?.toLocaleString()}`
                              : d.supplies
                                  ?.map((s) => `${s.item} x${s.quantity}`)
                                  .join(", ")}
                          </td>
                          <td data-label="Area">
                            {d.servedArea || <span className="di-muted">—</span>}
                          </td>
                          <td data-label="Impact">
                            {d.impactSummary ? (
                              <span className="di-state-done">
                                <CircleCheck size={13} strokeWidth={2} />
                                Added
                              </span>
                            ) : (
                              <span className="di-state-pending">
                                <Hourglass size={13} strokeWidth={2} />
                                Pending
                              </span>
                            )}
                          </td>
                          <td data-label="Images">
                            {d.impactImages && d.impactImages.length > 0 ? (
                              <span className="di-state-done">
                                <ImageIcon size={13} strokeWidth={2} />
                                {d.impactImages.length}
                              </span>
                            ) : (
                              <span className="di-muted">—</span>
                            )}
                          </td>
                          <td data-label="Certificate">
                            {d.certificateGenerated ? (
                              <span className="di-state-done">
                                <CircleCheck size={13} strokeWidth={2} />
                                Issued
                              </span>
                            ) : eligible ? (
                              <span className="di-muted">Not issued</span>
                            ) : (
                              // ADD: explain why it's locked, reusing existing di-muted style
                              <span className="di-muted">
                                Needs ৳{CERTIFICATE_MIN_AMOUNT}+
                              </span>
                            )}
                          </td>
                          <td data-label="Actions">
                            <div className="di-actions">
                              <button
                                className="di-btn di-btn-ghost"
                                onClick={() => openEdit(d)}
                              >
                                <Pencil size={13} strokeWidth={2} />
                                Edit Impact
                              </button>
                              <button
                                className="di-btn di-btn-cert"
                                onClick={() => generateCertificate(d)}
                                disabled={!eligible} // ADD: locks the button below threshold
                                title={
                                  eligible
                                    ? undefined
                                    : `Requires a money donation of ৳${CERTIFICATE_MIN_AMOUNT} or more`
                                }
                              >
                                {eligible ? (
                                  <FileBadge size={13} strokeWidth={2} />
                                ) : (
                                  <Lock size={13} strokeWidth={2} />
                                )}
                                {d.certificateGenerated
                                  ? "Re-issue"
                                  : "Generate Cert"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}