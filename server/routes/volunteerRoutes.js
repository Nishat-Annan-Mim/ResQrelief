const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const VolunteerModel = require("../model/Volunteer");
const UserModel = require("../model/User");
const BannedModel = require("../model/Banned");
const haversineDistanceKm = require("../utils/haversine");

/* ---------------- Check Volunteer ---------------- */
router.get("/volunteer/check/:email", async (req, res) => {
  try {
    const volunteer = await VolunteerModel.findOne({ email: req.params.email });
    if (volunteer) {
      return res.status(200).json({
        isVolunteer: true,
        profileCompleted: volunteer.profileCompleted,
        volunteer,
      });
    }
    return res.status(200).json({ isVolunteer: false, profileCompleted: false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Register Volunteer ---------------- */
router.post("/volunteer/register", async (req, res) => {
  try {
    const {
      userId, fullName, email, dateOfBirth, phone, address,
      gender, emergencyContact, nidNumber, volunteerPassword,
    } = req.body;

    const existingByEmail = await VolunteerModel.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: "Volunteer already exists with this email" });
    }

    const existingByNID = await VolunteerModel.findOne({ nidNumber });
    if (existingByNID) {
      return res.status(400).json({ message: "Volunteer already exists with this NID" });
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let hashedVolunteerPassword = "";
    if (volunteerPassword) {
      hashedVolunteerPassword = await bcrypt.hash(volunteerPassword, 10);
    }

    const newVolunteer = new VolunteerModel({
      userId, fullName, email, dateOfBirth, phone, address, gender,
      emergencyContact, nidNumber,
      volunteerPassword: hashedVolunteerPassword,
      profileCompleted: false,
      status: "pending",
    });
    await newVolunteer.save();

    res.status(201).json({ message: "Volunteer registered successfully", volunteer: newVolunteer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer Profile ---------------- */
router.get("/volunteer/profile/:email", async (req, res) => {
  try {
    const volunteer = await VolunteerModel.findOne({ email: req.params.email });
    if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json(volunteer);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Save Zone ---------------- */
router.put("/volunteer/zone/:email", async (req, res) => {
  try {
    const updated = await VolunteerModel.findOneAndUpdate(
      { email: req.params.email },
      { preferredZone: req.body.preferredZone },
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ message: "Volunteer not found" });
    res.json({ message: "Zone updated successfully", volunteer: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Save Role Setup ---------------- */
router.put("/volunteer/role-setup/:email", async (req, res) => {
  try {
    const { volunteerRole, skillsExperience, availableFrom, availableUntil, preferredTime } = req.body;
    const updated = await VolunteerModel.findOneAndUpdate(
      { email: req.params.email },
      { volunteerRole, skillsExperience, availableFrom, availableUntil, preferredTime, profileCompleted: true },
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ message: "Volunteer not found" });
    res.json({ message: "Volunteer role setup completed", volunteer: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- General Update ---------------- */
router.put("/volunteer/update/:email", async (req, res) => {
  try {
    const updated = await VolunteerModel.findOneAndUpdate(
      { email: req.params.email },
      req.body,
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ message: "Volunteer not found" });
    res.json({ message: "Volunteer profile updated", volunteer: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- All Volunteers Grouped By Zone ---------------- */
router.get("/volunteers/grouped-by-zone", async (req, res) => {
  try {
    const volunteers = await VolunteerModel.find(
      { profileCompleted: true, preferredZone: { $ne: "" } },
      { fullName: 1, email: 1, phone: 1, preferredZone: 1, volunteerRole: 1, availableFrom: 1, availableUntil: 1, preferredTime: 1 },
    ).sort({ preferredZone: 1, fullName: 1 });

    const grouped = volunteers.reduce((acc, v) => {
      const zone = v.preferredZone || "Unassigned";
      if (!acc[zone]) acc[zone] = [];
      acc[zone].push(v);
      return acc;
    }, {});

    res.status(200).json(grouped);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Share Location ---------------- */
router.put("/volunteer/location/:email", async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const updated = await VolunteerModel.findOneAndUpdate(
      { email: req.params.email },
      {
        locationSharingEnabled: true,
        currentLatitude: Number(lat),
        currentLongitude: Number(lng),
        currentAddress: address || "",
        lastLocationUpdatedAt: new Date(),
      },
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json({ message: "Location shared successfully", volunteer: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Remove Location ---------------- */
router.delete("/volunteer/location/:email", async (req, res) => {
  try {
    const updated = await VolunteerModel.findOneAndUpdate(
      { email: req.params.email },
      {
        locationSharingEnabled: false,
        currentLatitude: null,
        currentLongitude: null,
        currentAddress: "",
        lastLocationUpdatedAt: null,
      },
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json({ message: "Shared location removed", volunteer: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get All Sharing Locations ---------------- */
router.get("/volunteer/locations", async (req, res) => {
  try {
    const volunteers = await VolunteerModel.find(
      { locationSharingEnabled: true, currentLatitude: { $ne: null }, currentLongitude: { $ne: null } },
      { fullName: 1, email: 1, preferredZone: 1, volunteerRole: 1, currentLatitude: 1, currentLongitude: 1, currentAddress: 1, lastLocationUpdatedAt: 1 },
    ).sort({ lastLocationUpdatedAt: -1 });
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer Login ---------------- */
router.post("/volunteer/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const volunteer = await VolunteerModel.findOne({ email });
    if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });

    const isMatch = await bcrypt.compare(password, volunteer.volunteerPassword);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({
      message: "Login successful",
      volunteer: {
        id: volunteer._id,
        name: volunteer.fullName,
        email: volunteer.email,
        profileCompleted: volunteer.profileCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get Volunteers by District (for admin assign panel) ---------------- */
router.get("/api/volunteers/by-district/:district", async (req, res) => {
  try {
    const volunteers = await VolunteerModel.find({
      profileCompleted: true,
      preferredZone: { $regex: new RegExp(req.params.district, "i") },
      isBanned: { $ne: true },
    }).select("fullName email phone volunteerRole preferredZone preferredTime availableFrom availableUntil");
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get All Volunteers (Admin) ---------------- */
router.get("/api/volunteers/all", async (req, res) => {
  try {
    const { district } = req.query;
    const query = district
      ? { preferredZone: { $regex: new RegExp(district.trim(), "i") } }
      : {};
    const volunteers = await VolunteerModel.find(query).select(
      "fullName email phone volunteerRole preferredZone preferredTime availableFrom availableUntil status isBanned"
    );
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Confirm Volunteer (Admin) ---------------- */
router.put("/api/volunteer/confirm/:id", async (req, res) => {
  try {
    const updated = await VolunteerModel.findByIdAndUpdate(
      req.params.id,
      { status: "confirmed" },
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json({ message: "Volunteer confirmed successfully", volunteer: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Remove Volunteer (Admin) ---------------- */
router.delete("/api/volunteer/remove/:id", async (req, res) => {
  try {
    const deleted = await VolunteerModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Volunteer not found" });
    res.status(200).json({ message: "Volunteer removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Valid NIDs ---------------- */
const fs = require("fs");
const path = require("path");
router.get("/valid-nids", (req, res) => {
  const filePath = path.join(__dirname, "../validNidNumbers.txt");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Error reading NID file" });
    const nids = data.split("\n").map((n) => n.trim()).filter((n) => n !== "");
    res.json(nids);
  });
});

module.exports = router;