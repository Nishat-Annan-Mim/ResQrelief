const express = require("express");
const router = express.Router();
const RequestModel = require("../model/Request");
const VolunteerModel = require("../model/Volunteer");
const UserModel = require("../model/User");
const BannedModel = require("../model/Banned");
const NotificationModel = require("../model/Notification");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin1@resqrelief.com";

/* ================================================================
   FEATURE 1 — Beneficiary Request Portal
   FEATURE 2 — AI-Prioritized Needs Dashboard (CRUD)
   ================================================================ */

/* ---------------- Submit New Request (AI Priority auto-assigned) ---------------- */
router.post("/api/requests", async (req, res) => {
  try {
    const requestData = req.body;

    // Block banned phones
    const isBanned = await BannedModel.findOne({ phone: requestData.phoneNumber });
    if (isBanned) {
      return res.status(403).json({
        message: "This number has been banned due to a fraudulent request.",
        banned: true,
      });
    }

    // Block duplicate active requests
    const existingActive = await RequestModel.findOne({
      phoneNumber: requestData.phoneNumber,
      status: { $in: ["pending", "verified", "in_progress", "volunteer_done"] },
    });
    if (existingActive) {
      return res.status(409).json({
        message: "An active request already exists for this phone number.",
        duplicate: true,
      });
    }

    // AI Priority Classification
    let assignedPriority = "MEDIUM";
    try {
      const prompt = `
You are a disaster relief AI. Classify this aid request as HIGH, MEDIUM, or LOW priority.
Only reply with exactly one word: HIGH, MEDIUM, or LOW.

RULES:
- If peopleAffected is > 100, it MUST be HIGH.
- If words like "immediate", "medical", "dying", or "rescue" are in the description, it MUST be HIGH.

Aid Types: ${requestData.aidTypes?.join(", ") || "Unknown"}
People Affected: ${requestData.peopleAffected || 0}
District: ${requestData.district || "Unknown"}
Description: ${requestData.additionalDetails || "No description"}
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-safeguard-20b",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      console.log("FULL AI RESPONSE:", data);
      if (data.error) throw new Error(data.error.message);

      let text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error("No AI text returned");

      console.log("🤖 AI Raw Answer:", text);
      const match = text.match(/(HIGH|MEDIUM|LOW)/i);
      if (match) assignedPriority = match[1].toUpperCase();
      console.log("✅ Final Saved Priority:", assignedPriority);
    } catch (aiError) {
      console.error("❌ AI Priority Generation Failed:", aiError.message);
    }

    const newRequest = new RequestModel({ ...requestData, priority: assignedPriority });
    await newRequest.save();
    res.status(201).json({ message: "Request submitted successfully", request: newRequest });

    // Notify admin (non-blocking)
    try {
      const adminNotif = new NotificationModel({
        recipientEmail: ADMIN_EMAIL,
        title: `New ${assignedPriority} priority request — ${newRequest.district}`,
        message: `${newRequest.fullName} needs ${newRequest.aidTypes?.join(", ")} for ${newRequest.peopleAffected} people.`,
        type: "alert",
        link: `/admin-requests/${newRequest._id}`,
      });
      await adminNotif.save();
      if (global.io) global.io.to(ADMIN_EMAIL).emit("new-notification", adminNotif);
    } catch (notifErr) {
      console.error("Admin notification failed (non-critical):", notifErr.message);
    }
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get All Requests AI-Prioritized (Admin Dashboard) ---------------- */
router.get("/api/requests/ai-prioritized", async (req, res) => {
  try {
    const rawRequests = await RequestModel.find().lean().sort({ createdAt: -1 });
    const requests = rawRequests.map((r) => ({ ...r, priority: r.priority || "MEDIUM" }));
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    requests.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get Requests by Status ---------------- */
router.get("/api/requests/by-status/:status", async (req, res) => {
  try {
    const requests = await RequestModel.find({ status: req.params.status }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get Requests Assigned to a Volunteer ---------------- */
router.get("/api/requests/assigned-to/:email", async (req, res) => {
  try {
    const requests = await RequestModel.find({
      "assignedVolunteer.email": req.params.email,
      status: { $in: ["verified", "in_progress", "volunteer_done"] },
    }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get Single Request ---------------- */
router.get("/api/requests/:id", async (req, res) => {
  try {
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Verify Request + Assign Volunteer (Admin CRUD - Update) ---------------- */
router.put("/api/requests/:id/verify", async (req, res) => {
  try {
    const { assignedVolunteer } = req.body;

    if (assignedVolunteer?.email) {
      const activeCount = await RequestModel.countDocuments({
        "assignedVolunteer.email": assignedVolunteer.email,
        status: { $in: ["verified", "in_progress", "volunteer_done"] },
      });
      if (activeCount >= 2) {
        return res.status(409).json({
          message: `${assignedVolunteer.name} already has 2 active assignments. Please choose a different volunteer.`,
          limitReached: true,
        });
      }
    }

    const update = { status: "verified", ...(assignedVolunteer && { assignedVolunteer }) };
    const updated = await RequestModel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ message: "Request not found" });

    // Notify submitter
    if (updated.email) {
      await new NotificationModel({
        recipientEmail: updated.email,
        title: "Your aid request has been verified",
        message: `Your request for ${updated.aidTypes?.join(", ")} in ${updated.district} has been verified by our team.`,
        type: "request_verified",
        link: "/request-aid",
      }).save();
      global.io.to(updated.email).emit("alert", {
        title: "Aid Request Verified",
        message: `Your request in ${updated.district} has been verified!`,
      });
    }

    // Notify volunteer
    if (assignedVolunteer?.email) {
      await new NotificationModel({
        recipientEmail: assignedVolunteer.email,
        title: "You have been assigned to a request",
        message: `You have been assigned to help with a ${updated.aidTypes?.join(", ")} request in ${updated.district}.`,
        type: "volunteer_assigned",
        link: `/volunteer-assignment/${req.params.id}`,
      }).save();
      global.io.to(assignedVolunteer.email).emit("alert", {
        title: "New Assignment",
        message: `You have been assigned to a ${updated.district} request!`,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Override Priority (Admin CRUD - Update) ---------------- */
router.put("/api/requests/:id/priority", async (req, res) => {
  try {
    const { priority, overrideReason } = req.body;
    const updated = await RequestModel.findByIdAndUpdate(
      req.params.id,
      {
        priority,
        priorityOverridden: true,
        overrideReason,
        overriddenAt: new Date(),
        $push: {
          priorityHistory: {
            changedTo: priority,
            reason: overrideReason,
            changedAt: new Date(),
            changedBy: req.body.adminEmail || "Admin",
          },
        },
      },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to override priority" });
  }
});

/* ---------------- Volunteer Start Work ---------------- */
router.put("/api/requests/:id/start-work", async (req, res) => {
  try {
    const { volunteerEmail } = req.body;
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.assignedVolunteer?.email !== volunteerEmail)
      return res.status(403).json({ message: "Not authorized" });

    const updated = await RequestModel.findByIdAndUpdate(req.params.id, { status: "in_progress" }, { new: true });

    await new NotificationModel({
      recipientEmail: ADMIN_EMAIL,
      title: "Volunteer started work",
      message: `${request.assignedVolunteer.name} has started working on the ${request.district} request.`,
      type: "volunteer_update",
      link: `/admin-requests/${req.params.id}`,
    }).save();
    global.io.to(ADMIN_EMAIL).emit("alert", {
      title: "Volunteer Started Work",
      message: `${request.assignedVolunteer.name} is now working on the ${request.district} request.`,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer Send Inquiry ---------------- */
router.post("/api/requests/:id/inquiry", async (req, res) => {
  try {
    const { message, volunteerEmail, volunteerName } = req.body;
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.assignedVolunteer?.email !== volunteerEmail)
      return res.status(403).json({ message: "Not authorized" });

    const updated = await RequestModel.findByIdAndUpdate(
      req.params.id,
      { $push: { inquiries: { from: "volunteer", senderEmail: volunteerEmail, senderName: volunteerName, message, sentAt: new Date() } } },
      { new: true }
    );

    await new NotificationModel({
      recipientEmail: ADMIN_EMAIL,
      title: `Inquiry from ${volunteerName}`,
      message: `"${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`,
      type: "inquiry",
      link: `/admin-requests/${req.params.id}`,
    }).save();
    global.io.to(ADMIN_EMAIL).emit("alert", {
      title: "Volunteer Inquiry",
      message: `${volunteerName} sent a message about the ${request.district} request.`,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Admin Reply to Inquiry ---------------- */
router.post("/api/requests/:id/inquiry/reply", async (req, res) => {
  try {
    const { message, adminName } = req.body;
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const updated = await RequestModel.findByIdAndUpdate(
      req.params.id,
      { $push: { inquiries: { from: "admin", senderEmail: ADMIN_EMAIL, senderName: adminName || "Admin", message, sentAt: new Date() } } },
      { new: true }
    );

    if (request.assignedVolunteer?.email) {
      await new NotificationModel({
        recipientEmail: request.assignedVolunteer.email,
        title: "Admin replied to your inquiry",
        message: `"${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`,
        type: "inquiry_reply",
        link: `/volunteer-assignment/${req.params.id}`,
      }).save();
      global.io.to(request.assignedVolunteer.email).emit("alert", {
        title: "Admin Replied",
        message: `Admin responded about the ${request.district} request.`,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer Mark Done ---------------- */
router.put("/api/requests/:id/volunteer-done", async (req, res) => {
  try {
    const { volunteerEmail } = req.body;
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.assignedVolunteer?.email !== volunteerEmail)
      return res.status(403).json({ message: "Not authorized" });

    const updated = await RequestModel.findByIdAndUpdate(req.params.id, { status: "volunteer_done" }, { new: true });

    await new NotificationModel({
      recipientEmail: ADMIN_EMAIL,
      title: "Volunteer marked request done ✅",
      message: `${request.assignedVolunteer.name} completed work on the ${request.district} request. Please review and close.`,
      type: "volunteer_done",
      link: `/admin-requests/${req.params.id}`,
    }).save();
    global.io.to(ADMIN_EMAIL).emit("alert", {
      title: "Request Ready to Close ✅",
      message: `${request.assignedVolunteer.name} finished the ${request.district} request!`,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Admin Complete Request ---------------- */
router.put("/api/requests/:id/complete", async (req, res) => {
  try {
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const updated = await RequestModel.findByIdAndUpdate(
      req.params.id,
      { status: "completed", completedAt: new Date() },
      { new: true }
    );

    if (updated.email) {
      await new NotificationModel({
        recipientEmail: updated.email,
        title: "Your aid request has been fulfilled",
        message: `Your request for ${updated.aidTypes?.join(", ")} in ${updated.district} has been completed.`,
        type: "request_completed",
        link: "/request-aid",
      }).save();
      global.io.to(updated.email).emit("alert", {
        title: "Aid Request Fulfilled",
        message: `Your request in ${updated.district} has been completed!`,
      });
    }

    if (updated.assignedVolunteer?.email) {
      await new NotificationModel({
        recipientEmail: updated.assignedVolunteer.email,
        title: "Request officially closed",
        message: `The ${updated.district} request has been marked as completed by admin. Great work!`,
        type: "request_completed",
        link: "/volunteer-dashboard",
      }).save();
      global.io.to(updated.assignedVolunteer.email).emit("alert", {
        title: "Request Closed",
        message: `The ${updated.district} request is officially done. Well done!`,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Fraud: Delete + Ban (Admin CRUD - Delete) ---------------- */
router.delete("/api/requests/:id", async (req, res) => {
  try {
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const submitterEmail = request.email || null;

    await BannedModel.findOneAndUpdate(
      { $or: [{ phone: request.phoneNumber }, { email: submitterEmail }].filter(Boolean) },
      { phone: request.phoneNumber, email: submitterEmail, bannedAt: new Date(), reason: "fraud" },
      { upsert: true, new: true },
    );

    if (submitterEmail) {
      await UserModel.findOneAndUpdate({ email: submitterEmail }, { isBanned: true });
    }

    await VolunteerModel.findOneAndUpdate(
      { $or: [{ phone: request.phoneNumber }, ...(submitterEmail ? [{ email: submitterEmail }] : [])] },
      { isBanned: true },
    );

    if (submitterEmail) {
      const submitter = await UserModel.findOne({ email: submitterEmail });
      if (submitter && submitter.role !== "admin") {
        global.io.to(submitterEmail).emit("banned", {
          message: "Your account has been banned due to a fraudulent request.",
        });
      }
    }

    await RequestModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Request marked as fraud, submitter banned" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Simple Delete (no ban) ---------------- */
router.delete("/api/requests/:id/remove", async (req, res) => {
  try {
    const deleted = await RequestModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Fraud Analysis (AI) ---------------- */
router.get("/api/requests/:id/fraud-analysis", async (req, res) => {
  try {
    const request = await RequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.aiAnalysis?.verdict) return res.status(200).json(request.aiAnalysis);

    const fraudPrompt = `You are a fraud detection system for a disaster relief platform in Bangladesh.
Analyze this aid request and return ONLY a valid JSON object, no extra text:

{
  "fraudScore": <number 0-100>,
  "verdict": "<LEGITIMATE or SUSPICIOUS or LIKELY_FRAUD>",
  "reason": "<one sentence>"
}

Request:
- District: ${request.district}
- Aid Types: ${request.aidTypes?.join(", ")}
- People Affected: ${request.peopleAffected}
- Description: ${request.additionalDetails || "N/A"}
- Phone: ${request.phoneNumber}
- Email: ${request.email}`;

    const fraudRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b",
        messages: [{ role: "user", content: fraudPrompt }],
      }),
    });

    const fraudData = await fraudRes.json();
    const raw = fraudData?.choices?.[0]?.message?.content;
    if (!raw) return res.status(500).json({ message: "AI returned no response" });

    const analysis = JSON.parse(raw.replace(/```json|```/g, "").trim());
    await RequestModel.findByIdAndUpdate(req.params.id, { aiAnalysis: analysis });
    res.status(200).json(analysis);
  } catch (err) {
    res.status(500).json({ message: "Fraud analysis failed" });
  }
});

/* ---------------- Get Banned List ---------------- */
router.get("/api/banned", async (req, res) => {
  try {
    const banned = await BannedModel.find().sort({ bannedAt: -1 });
    res.status(200).json(banned);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Check If Phone Is Banned ---------------- */
router.get("/api/banned/check/:phone", async (req, res) => {
  try {
    const banned = await BannedModel.findOne({ phone: req.params.phone });
    res.status(200).json({ isBanned: !!banned });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;