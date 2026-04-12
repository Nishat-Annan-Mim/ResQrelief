const express = require("express");
const router = express.Router();
const Alert = require("../model/Alert");
const nodemailer = require("nodemailer");
const NotificationModel = require("../model/Notification");

// ── District coordinates (same map as index.js) ──────────────────────────────
const DISTRICT_COORDS = {
  "Dhaka":        { lat: 23.8103, lng: 90.4125 },
  "Chattogram":   { lat: 22.3569, lng: 91.7832 },
  "Sylhet":       { lat: 24.8949, lng: 91.8687 },
  "Rajshahi":     { lat: 24.3745, lng: 88.6042 },
  "Khulna":       { lat: 22.8456, lng: 89.5403 },
  "Barishal":     { lat: 22.7010, lng: 90.3535 },
  "Rangpur":      { lat: 25.7439, lng: 89.2752 },
  "Mymensingh":   { lat: 24.7471, lng: 90.4203 },
  "Cumilla":      { lat: 23.4607, lng: 91.1809 },
  "Narayanganj":  { lat: 23.6238, lng: 90.5000 },
  "Gazipur":      { lat: 23.9999, lng: 90.4203 },
  "Cox's Bazar":  { lat: 21.4272, lng: 92.0058 },
  "Bogura":       { lat: 24.8465, lng: 89.3776 },
  "Dinajpur":     { lat: 25.6279, lng: 88.6338 },
  "Jashore":      { lat: 23.1664, lng: 89.2080 },
  "Tangail":      { lat: 24.2513, lng: 89.9167 },
  "Faridpur":     { lat: 23.6070, lng: 89.8429 },
  "Brahmanbaria": { lat: 23.9570, lng: 91.1115 },
  "Noakhali":     { lat: 22.8696, lng: 91.0993 },
  "Feni":         { lat: 23.0159, lng: 91.3976 },
  "Lakshmipur":   { lat: 22.9449, lng: 90.8412 },
  "Chandpur":     { lat: 23.2513, lng: 90.6520 },
  "Habiganj":     { lat: 24.3745, lng: 91.4156 },
  "Moulvibazar":  { lat: 24.4829, lng: 91.7774 },
  "Sunamganj":    { lat: 25.0651, lng: 91.3950 },
  "Kishoreganj":  { lat: 24.4449, lng: 90.7766 },
  "Netrokona":    { lat: 24.8103, lng: 90.8674 },
  "Jamalpur":     { lat: 24.9374, lng: 89.9371 },
  "Sherpur":      { lat: 25.0204, lng: 90.0152 },
  "Manikganj":    { lat: 23.8643, lng: 90.0024 },
  "Munshiganj":   { lat: 23.5422, lng: 90.5305 },
  "Narsingdi":    { lat: 23.9322, lng: 90.7150 },
  "Madaripur":    { lat: 23.1641, lng: 90.2015 },
  "Shariatpur":   { lat: 23.2423, lng: 90.4350 },
  "Gopalganj":    { lat: 23.0050, lng: 89.8267 },
  "Rajbari":      { lat: 23.7574, lng: 89.6441 },
  "Magura":       { lat: 23.4876, lng: 89.4196 },
  "Narail":       { lat: 23.1724, lng: 89.5120 },
  "Satkhira":     { lat: 22.7185, lng: 89.0705 },
  "Bagerhat":     { lat: 22.6602, lng: 89.7854 },
  "Chuadanga":    { lat: 23.6401, lng: 88.8415 },
  "Meherpur":     { lat: 23.7621, lng: 88.6318 },
  "Kushtia":      { lat: 23.9013, lng: 89.1204 },
  "Jhenaidah":    { lat: 23.5449, lng: 89.1522 },
  "Natore":       { lat: 24.4204, lng: 88.9882 },
  "Sirajganj":    { lat: 24.4535, lng: 89.7006 },
  "Pabna":        { lat: 24.0064, lng: 89.2372 },
  "Naogaon":      { lat: 24.7936, lng: 88.9312 },
  "Joypurhat":    { lat: 25.1024, lng: 89.0200 },
  "Kurigram":     { lat: 25.8074, lng: 89.6364 },
  "Gaibandha":    { lat: 25.3288, lng: 89.5285 },
  "Lalmonirhat":  { lat: 25.9923, lng: 89.2847 },
  "Nilphamari":   { lat: 25.9310, lng: 88.8560 },
  "Panchagarh":   { lat: 26.3411, lng: 88.5541 },
  "Thakurgaon":   { lat: 26.0318, lng: 88.4616 },
  "Patuakhali":   { lat: 22.3596, lng: 90.3298 },
  "Barguna":      { lat: 22.1551, lng: 89.9951 },
  "Pirojpur":     { lat: 22.5841, lng: 89.9749 },
  "Jhalokathi":   { lat: 22.6406, lng: 90.1985 },
  "Bhola":        { lat: 22.6860, lng: 90.6482 },
  "Bandarban":    { lat: 22.1953, lng: 92.2184 },
  "Rangamati":    { lat: 22.6352, lng: 92.2018 },
  "Khagrachhari": { lat: 23.1193, lng: 91.9847 },
};

// ── Haversine distance in km ──────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

// ── Tiered volunteer email selector ──────────────────────────────────────────
//
//  Tier 1 — Very Near  :  0–20 km   → email ALL
//  Tier 2 — Near       : 20–50 km   → email ALL
//  Tier 3 — Far        : 50+ km     → email ONLY the single closest volunteer
//
//  Cascade rule:
//   • If Tier 1 or Tier 2 has anyone → do NOT fall into Tier 3 (already covered)
//   • If both Tier 1 and Tier 2 are empty → use Tier 3 (min 1, closest only)
//
const selectVolunteersToEmail = (volunteers, alertLat, alertLng) => {
  // Attach distance to every volunteer that has a known zone coord
  const withDistance = volunteers
    .map((v) => {
      // Prefer live GPS location, fall back to preferred zone centroid
      let lat, lng;
      if (v.currentLatitude && v.currentLongitude) {
        lat = v.currentLatitude;
        lng = v.currentLongitude;
      } else {
        const coord = DISTRICT_COORDS[v.preferredZone];
        if (!coord) return null; // no location data at all — skip
        lat = coord.lat;
        lng = coord.lng;
      }
      return { volunteer: v, distanceKm: haversineKm(alertLat, alertLng, lat, lng) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const veryNear = withDistance.filter((e) => e.distanceKm <= 20);
  const near     = withDistance.filter((e) => e.distanceKm > 20 && e.distanceKm <= 50);
  const far      = withDistance.filter((e) => e.distanceKm > 50);

  const chosen = [];

  // Always include all very-near and near volunteers
  chosen.push(...veryNear, ...near);

  // Only dip into far if nobody was closer
  if (chosen.length === 0 && far.length > 0) {
    chosen.push(far[0]); // just the single closest far volunteer
  }

  console.log(
    `📍 Alert email tiers — veryNear: ${veryNear.length}, near: ${near.length}, far selected: ${chosen.length === 0 ? 0 : Math.max(0, chosen.length - veryNear.length - near.length)}`
  );

  return chosen.map((e) => ({ ...e.volunteer.toObject?.() ?? e.volunteer, _distanceKm: e.distanceKm }));
};

// ── Email transport ───────────────────────────────────────────────────────────
const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

const buildEmailHtml = (alertTitle, message, district) => {
  const date = new Date().toLocaleDateString("en-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${alertTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">

          <!-- Header -->
          <tr>
            <td style="background:#c0392b;padding:24px 32px;">
              <p style="margin:0;color:#fff;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Emergency Notification</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;line-height:1.3;">
                🚨 ${alertTitle}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:13px;color:#999;">${date}</p>
              <p style="margin:0 0 20px;font-size:14px;color:#333;">Dear Recipient,</p>

              <p style="margin:0 0 20px;font-size:14px;color:#333;line-height:1.7;">
                This is an official emergency alert issued by the <strong>ResQRelief</strong> response team.
                ${district ? `This alert pertains to the <strong>${district}</strong> area.` : ""}
                Please review the following notice carefully:
              </p>

              <!-- Alert message box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fdf2f2;border-left:4px solid #c0392b;padding:16px 20px;border-radius:4px;">
                    <p style="margin:0;font-size:14px;color:#2c2c2c;line-height:1.7;">${message}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:14px;color:#333;line-height:1.7;">
                If you are a volunteer, please take appropriate action as per your role and training.
                If you require further information, please contact the ResQRelief operations team.
              </p>

              <p style="margin:0;font-size:14px;color:#333;">
                Regards,<br/>
                <strong>ResQRelief Emergency Operations</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aaa;">
                This is an automated alert from ResQRelief. Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

const sendEmail = async (to, subject, message, district) => {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: `"ResQRelief Alerts" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🚨 [ResQRelief] ${subject}`,
      text: `Emergency Alert: ${subject}\n\n${message}\n\nThis is an automated message from ResQRelief. Do not reply.`,
      html: buildEmailHtml(subject, message, district),
    });
    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ Email failed for", to, ":", err.message);
    throw err;
  }
};

// ── POST /api/alerts ──────────────────────────────────────────────────────────
router.post("/alerts", async (req, res) => {
  try {
    const role = req.headers.role;
    if (role !== "admin") return res.status(403).json({ message: "Unauthorized" });

    const { alertTitle, message, audience, channels, district } = req.body;
    // `district` is optional — admin can pass it from the alert form to enable
    // distance-based filtering. If omitted, falls back to sending to all.

    if (!audience || !channels) return res.status(400).json({ message: "Missing fields" });

    // ── 1. Collect all candidate recipients ──────────────────────────────────
    let volunteerDocs = [];
    let beneficiaryEmails = new Set();

    if (audience.includes("volunteers")) {
      volunteerDocs = await require("../model/Volunteer").find({ isBanned: { $ne: true } });
    }

    if (audience.includes("beneficiaries")) {
      const users = await require("../model/User").find();
      users.forEach((u) => beneficiaryEmails.add(u.email));
    }

    // ── 2. For volunteers: apply distance-tiered selection (email channel only)
    //       In-app notifications still go to ALL volunteers regardless of distance
    //       (they're already logged in — no harm in notifying everyone in-app)
    let volunteersToEmail = volunteerDocs; // default: all (used when no district given)

    const alertCoord = district ? DISTRICT_COORDS[district] : null;

    if (channels.includes("email") && alertCoord && volunteerDocs.length > 0) {
      volunteersToEmail = selectVolunteersToEmail(volunteerDocs, alertCoord.lat, alertCoord.lng);
      console.log(
        `📧 Tiered email: ${volunteersToEmail.length} / ${volunteerDocs.length} volunteers selected for district "${district}"`
      );
    }

    // ── 3. Build final email recipient set ───────────────────────────────────
    const emailVolunteerSet = new Set(volunteersToEmail.map((v) => v.email));
    const allEmailRecipients = new Set([...emailVolunteerSet, ...beneficiaryEmails]);

    // All volunteer emails for in-app notifications
    const allVolunteerEmails = volunteerDocs.map((v) => v.email);

    // ── 4. Save alert record ─────────────────────────────────────────────────
    const newAlert = new Alert({
      alertTitle,
      message,
      audience,
      channels,
      district: district || null,
      recipients: Array.from(allEmailRecipients),
    });
    await newAlert.save();

    // ── 5. In-app notifications → ALL volunteers + beneficiaries ─────────────
    const inAppRecipients = new Set([...allVolunteerEmails, ...beneficiaryEmails]);

    for (const userEmail of inAppRecipients) {
      await new NotificationModel({
        recipientEmail: userEmail,
        title: alertTitle,
        message,
        type: "alert",
        link: "/home",
      }).save();

      if (channels.includes("app")) {
        global.io.to(userEmail).emit("alert", { title: alertTitle, message });
      }
    }

    // ── 6. Emails → tiered volunteers + all beneficiaries ────────────────────
    if (channels.includes("email")) {
      for (const userEmail of allEmailRecipients) {
        try {
          await sendEmail(userEmail, alertTitle, message, district);
        } catch {
          console.log("⚠️  Skipping email for:", userEmail);
        }
      }
    }

    res.status(201).json({
      ...newAlert.toObject(),
      emailsSent: allEmailRecipients.size,
      inAppSent: inAppRecipients.size,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send alert" });
  }
});

/* GET ALL ALERTS */
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

/* PATCH /api/alerts/:id/expire */
router.patch("/alerts/:id/expire", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
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