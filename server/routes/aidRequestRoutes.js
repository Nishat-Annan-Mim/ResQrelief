const express = require("express");
const router = express.Router();
const AidRequestModel = require("../model/AidRequest");
const VolunteerModel = require("../model/Volunteer");
const haversineDistanceKm = require("../utils/haversine");

/* ---------------- Create Aid Request ---------------- */
router.post("/aid-requests", async (req, res) => {
  try {
    const {
      createdByVolunteerId, createdByVolunteerName, createdByVolunteerEmail,
      requestType, severity, description, latitude, longitude, address,
    } = req.body;

    const newRequest = new AidRequestModel({
      createdByVolunteerId, createdByVolunteerName, createdByVolunteerEmail,
      requestType, severity, description, latitude, longitude, address,
      status: "need",
    });
    await newRequest.save();
    res.status(201).json({ message: "Aid request created successfully", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get All Aid Requests ---------------- */
router.get("/aid-requests", async (req, res) => {
  try {
    const requests = await AidRequestModel.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get Nearby Aid Requests ---------------- */
router.get("/aid-requests/nearby/:email", async (req, res) => {
  try {
    const volunteer = await VolunteerModel.findOne({ email: req.params.email });
    if (!volunteer || volunteer.currentLatitude === null || volunteer.currentLongitude === null) {
      return res.status(400).json({ message: "Volunteer location not shared yet" });
    }

    const requests = await AidRequestModel.find({
      createdByVolunteerEmail: { $ne: req.params.email },
    }).sort({ createdAt: -1 });

    const nearbyRequests = requests
      .map((r) => ({
        ...r.toObject(),
        distanceKm: haversineDistanceKm(
          volunteer.currentLatitude, volunteer.currentLongitude,
          r.latitude, r.longitude,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json(nearbyRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Accept Aid Request ---------------- */
router.put("/aid-requests/:requestId/accept", async (req, res) => {
  try {
    const { helperVolunteerId, helperVolunteerName, helperVolunteerEmail } = req.body;
    const request = await AidRequestModel.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const updated = await AidRequestModel.findByIdAndUpdate(
      req.params.requestId,
      {
        status: "helping",
        helperVolunteerId, helperVolunteerName, helperVolunteerEmail,
        helperMessage: `Coming for help... Volunteer ${helperVolunteerName} is on the way.`,
      },
      { returnDocument: "after" },
    );
    res.status(200).json({ message: "Request accepted successfully", request: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Mark As Helped ---------------- */
router.put("/aid-requests/:requestId/helped", async (req, res) => {
  try {
    const { helperVolunteerEmail } = req.body;
    const request = await AidRequestModel.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.helperVolunteerEmail !== helperVolunteerEmail) {
      return res.status(403).json({ message: "Only the assigned helper can mark this helped" });
    }
    const updated = await AidRequestModel.findByIdAndUpdate(
      req.params.requestId,
      { status: "helped", helperMessage: "This request has already received help." },
      { returnDocument: "after" },
    );
    res.status(200).json({ message: "Request marked as helped", request: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Cancel Aid Request (Helper Volunteer) ---------------- */
router.put("/aid-requests/:id/cancel", async (req, res) => {
  try {
    const request = await AidRequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.helperVolunteerEmail !== req.body.cancellerEmail) {
      return res.status(403).json({ message: "Not authorized to cancel" });
    }
    request.status = "need";
    request.helperVolunteerId = null;
    request.helperVolunteerName = null;
    request.helperVolunteerEmail = null;
    request.helperMessage = null;
    await request.save();
    res.json({ message: "Request cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Delete Aid Request (Creator) ---------------- */
router.delete("/aid-requests/:requestId", async (req, res) => {
  try {
    const request = await AidRequestModel.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.createdByVolunteerEmail !== req.body.requesterEmail) {
      return res.status(403).json({ message: "Only the volunteer who created this request can delete it" });
    }
    await AidRequestModel.findByIdAndDelete(req.params.requestId);
    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Admin: Get All Aid Requests ---------------- */
router.get("/api/admin/aid-requests", async (req, res) => {
  try {
    const requests = await AidRequestModel.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Admin: Delete Any Aid Request ---------------- */
router.delete("/api/admin/aid-requests/:id", async (req, res) => {
  try {
    const deleted = await AidRequestModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;