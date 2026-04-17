const express = require("express");
const router = express.Router();
const DonationModel = require("../model/Donation");
const { v4: uuidv4 } = require("uuid");

// ✅ PUT THIS FIRST — before any /admin routes
// GET donations by donor email (for donor view)
router.get("/my-donations/:email", async (req, res) => {
  try {
    const donations = await DonationModel.find({
      donorEmail: req.params.email,
      paymentStatus: "success",
    })
      .sort({ createdAt: -1 })
      .select(
        "donorName donorEmail donationType amount supplies createdAt impactSummary impactImages certificateGenerated certificateData transactionId servedArea isUtilized utilizedAmount"
      );
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET all donations with impact data (admin view)
router.get("/admin/donor-impact", async (req, res) => {
  try {
    const donations = await DonationModel.find({
      paymentStatus: "success",
    })
      .sort({ createdAt: -1 })
      .select(
        "donorName donorEmail donationType amount supplies createdAt impactSummary impactImages certificateGenerated certificateData transactionId servedArea isUtilized utilizedAmount"
      );
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET single donor impact by donation ID
router.get("/admin/donor-impact/:id", async (req, res) => {
  try {
    const donation = await DonationModel.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Not found" });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH — admin updates impact summary and images for a donation
router.patch("/admin/donor-impact/:id", async (req, res) => {
  try {
    const { impactSummary, impactImages, servedArea, isUtilized, utilizedAmount } = req.body;
    const updated = await DonationModel.findByIdAndUpdate(
      req.params.id,
      { impactSummary, impactImages, servedArea, isUtilized, utilizedAmount },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST — generate certificate for a donation
router.post("/admin/donor-impact/:id/certificate", async (req, res) => {
  try {
    const donation = await DonationModel.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Not found" });

    const certificateId = "CERT-" + uuidv4().replace(/-/g, "").toUpperCase().slice(0, 12);

    const updated = await DonationModel.findByIdAndUpdate(
      req.params.id,
      {
        certificateGenerated: true,
        certificateData: {
          issuedAt: new Date(),
          certificateId,
        },
      },
      { new: true }
    );

    res.json({
      message: "Certificate generated",
      certificateId,
      donation: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;