const express = require("express");
const router = express.Router();
const Alert = require("../model/Alert");
const nodemailer = require("nodemailer");
const NotificationModel = require("../model/Notification"); // ✅ NEW

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async (to, subject, text) => {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ Email failed:", err);
    throw err;
  }
};

router.post("/alerts", async (req, res) => {
  try {
    const role = req.headers.role;

    if (role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { alertTitle, message, audience, channels } = req.body;

    if (!audience || !channels) {
      return res.status(400).json({ message: "Missing fields" });
    }

    let recipients = new Set();

    if (audience.includes("volunteers")) {
      const volunteers = await require("../model/Volunteer").find();
      recipients = new Set([...recipients, ...volunteers.map((v) => v.email)]);
    }

    if (audience.includes("beneficiaries")) {
      const users = await require("../model/User").find();
      recipients = new Set([...recipients, ...users.map((u) => u.email)]);
    }

    const newAlert = new Alert({
      alertTitle,
      message,
      audience,
      channels,
      recipients: Array.from(recipients),
    });

    await newAlert.save();

    for (const userEmail of recipients) {

      // ✅ NEW — Save notification to DB for each recipient
      const notif = new NotificationModel({
        recipientEmail: userEmail,
        title: alertTitle,
        message,
        type: "alert",
        link: "/home",
      });
      await notif.save();

      if (channels.includes("app")) {
        global.io.to(userEmail).emit("alert", {
          title: alertTitle,
          message,
        });
      }

      if (channels.includes("email")) {
        try {
          await sendEmail(userEmail, alertTitle, message);
        } catch (err) {
          console.log("Skipping email for:", userEmail);
        }
      }
    }

    res.status(201).json(newAlert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send alert" });
  }
});

/* GET ALL ALERTS */
router.get("/alerts", async (req, res) => {
  const alerts = await Alert.find();
  res.json(alerts);
});

// PATCH /api/alerts/:id/expire
router.patch("/alerts/:id/expire", async (req, res) => {
  try {
    const alert = await AlertModel.findByIdAndUpdate(
      req.params.id,
      { status: "expired" },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.status(200).json(alert);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;