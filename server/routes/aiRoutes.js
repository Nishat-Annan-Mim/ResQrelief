const express = require("express");
const router = express.Router();
const VolunteerModel = require("../model/Volunteer");
const VolunteerTaskModel = require("../model/VolunteerTask");
const InventoryModel = require("../model/Inventory");
const DonationModel = require("../model/Donation");
const DISTRICT_COORDS = require("../utils/districtCoords");
const haversineDistanceKm = require("../utils/haversine");

/* ================================================================
   FEATURE 3 — AI-Based Resource Allocation
   ================================================================ */
router.post("/api/ai/resource-allocation", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: "Server configuration error: Missing API Key" });
    }

    const { aidTypes, peopleAffected, district, description } = req.body;

    const inventory = await InventoryModel.find();
    const inventorySummary = inventory
      .map((item) => `${item.itemName} (${item.category}): ${item.quantity} units, Status: ${item.status}`)
      .join("\n");

    const prompt = `
You are a disaster relief resource allocation AI.

A request has come in:
- Location: ${district}
- Aid Types Needed: ${aidTypes?.join(", ")}
- People Affected: ${peopleAffected}
- Description: ${description || "No description"}

Current inventory available:
${inventorySummary}

Based on the request and available inventory, recommend what resources to allocate.
Reply in this exact JSON format only, no extra text:
{
  "recommendations": [
    { "item": "Item Name", "quantity": 50, "reason": "Why this item is needed" }
  ],
  "summary": "One sentence overall allocation summary"
}
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ResQrelief",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    console.log("OpenRouter raw response:", JSON.stringify(data));
    if (data.error) throw new Error(data.error.message);

    let text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No AI text returned");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(parsed);
  } catch (error) {
    console.error("❌ AI resource allocation failed:", error.message);
    res.status(500).json({ message: "AI resource allocation failed" });
  }
});

/* ================================================================
   FEATURE 4 — Skill-Based Volunteer Matching
   ================================================================ */
router.post("/api/ai/volunteer-match", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: "Server configuration error: Missing API Key" });
    }

    const { aidTypes, peopleAffected, district, description, requestId } = req.body;

    // Resolve coordinates
    const districtCoords = DISTRICT_COORDS[district];
    const latitude  = req.body.latitude  ?? districtCoords?.lat;
    const longitude = req.body.longitude ?? districtCoords?.lng;

    // Get confirmed volunteers
    const allVolunteers = await VolunteerModel.find({ status: "confirmed", profileCompleted: true });

    // Exclude already-assigned volunteers for this request
    let assignedEmails = new Set();
    if (requestId) {
      const assignedTasks = await VolunteerTaskModel.find({ requestId });
      assignedEmails = new Set(assignedTasks.map((t) => t.assignedTo?.volunteerEmail).filter(Boolean));
    }
    const availableVolunteers = allVolunteers.filter((v) => !assignedEmails.has(v.email));

    // Distance filter
    let withDistance = [];
    if (latitude && longitude) {
      withDistance = availableVolunteers
        .filter((v) => v.currentLatitude && v.currentLongitude)
        .map((v) => ({
          ...v.toObject(),
          distanceKm: haversineDistanceKm(latitude, longitude, v.currentLatitude, v.currentLongitude),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      withDistance = availableVolunteers
        .filter((v) => v.preferredZone === district)
        .map((v) => ({ ...v.toObject(), distanceKm: null }));
    }

    // Skill scoring
    const aidKeywords = aidTypes?.map((a) => a.toLowerCase()) || [];
    const scoreSkill = (v) => {
      const combined = `${v.volunteerRole} ${v.skillsExperience}`.toLowerCase();
      return aidKeywords.some((k) => combined.includes(k)) ? 1 : 0;
    };

    const tagged = withDistance.map((v) => ({
      ...v,
      skillMatch: scoreSkill(v),
      distanceMatch: v.distanceKm === null ? 1 : v.distanceKm <= 50 ? 1 : 0,
    }));

    const bothMatch    = tagged.filter((v) => v.skillMatch && v.distanceMatch);
    const distanceOnly = tagged.filter((v) => !v.skillMatch && v.distanceMatch);
    const skillOnly    = tagged.filter((v) => v.skillMatch && !v.distanceMatch);

    const shortlist = [
      ...bothMatch.slice(0, 10),
      ...distanceOnly.slice(0, 3),
      ...skillOnly.slice(0, 2),
    ].slice(0, 15);

    if (shortlist.length === 0) {
      const noOneLeft = assignedEmails.size > 0 && availableVolunteers.length === 0;
      return res.status(200).json({
        matches: [],
        summary: noOneLeft
          ? "All available volunteers near this location have already been assigned to this request."
          : "No confirmed volunteers found near this location.",
      });
    }

    const formatVol = (v, tag) =>
      `[${tag}] Name: ${v.fullName}, Role: ${v.volunteerRole}, Skills: ${v.skillsExperience || "None"}, Zone: ${v.preferredZone}, Availability: ${v.preferredTime || "Flexible"}${v.distanceKm !== null ? `, Distance: ${v.distanceKm}km` : ""}`;

    const volunteerSummary = [
      ...bothMatch.slice(0, 10).map((v) => formatVol(v, "SKILL+DISTANCE MATCH")),
      ...distanceOnly.slice(0, 3).map((v) => formatVol(v, "CLOSE BUT SKILL MISMATCH")),
      ...skillOnly.slice(0, 2).map((v) => formatVol(v, "SKILL MATCH BUT FARTHER")),
    ].join("\n");

    const prompt = `
You are a disaster relief volunteer matching AI.

A request has come in:
- Location: ${district}
- Aid Types Needed: ${aidTypes?.join(", ")}
- People Affected: ${peopleAffected}
- Description: ${description || "No description"}

Volunteers are pre-tagged:
- [SKILL+DISTANCE MATCH] = ideal candidates, prioritize these
- [CLOSE BUT SKILL MISMATCH] = nearby but skills may not fit
- [SKILL MATCH BUT FARTHER] = right skills but farther away

${volunteerSummary}

Pick the TOP 3. Always prefer SKILL+DISTANCE matches.

Reply in this exact JSON format only, no extra text:
{
  "matches": [
    {
      "name": "Volunteer Name",
      "reason": "Why selected — mention skill fit and distance",
      "matchScore": 95,
      "matchType": "perfect"
    }
  ],
  "summary": "One sentence about the selection"
}

matchType must be one of: "perfect", "distance", "skill"
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ResQrelief",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No AI text returned");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(parsed);
  } catch (error) {
    console.error("❌ AI volunteer matching failed:", error.message);
    res.status(500).json({ message: "AI volunteer matching failed" });
  }
});

/* ================================================================
   AI Donation Allocation
   ================================================================ */
router.post("/api/ai/donation-allocation", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: "Server configuration error: Missing API Key" });
    }

    const { district, aidTypes, peopleAffected, priority, description } = req.body;

    const collected = await DonationModel.aggregate([
      { $match: { donationType: "money", paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const utilized = await DonationModel.aggregate([
      { $match: { donationType: "money", isUtilized: true } },
      { $group: { _id: null, total: { $sum: "$utilizedAmount" } } },
    ]);
    const available = (collected[0]?.total || 0) - (utilized[0]?.total || 0);

    const prompt = `
You are a disaster relief fund allocation advisor for Bangladesh.

Aid Request Details:
- District: ${district}
- Aid Types Needed: ${aidTypes?.join(", ")}
- People Affected: ${peopleAffected}
- Priority: ${priority}
- Description: ${description || "N/A"}
- Available Funds in System: ৳${available} BDT

Reply in this exact JSON format only, no extra text:
{
  "estimatedTotal": <number in BDT>,
  "breakdown": [
    { "category": "<food/medicine/shelter/etc>", "amount": <number>, "reason": "<brief reason>" }
  ],
  "volunteersNeeded": <number>,
  "canFullyFund": <true/false>,
  "shortfall": <number or 0>,
  "reasoning": "<2-3 sentence overall strategy>"
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ResQrelief",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No AI text returned");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const estimatedTotal = Number(parsed.estimatedTotal) || 0;
    const canFullyFund = available >= estimatedTotal;
    const shortfall = canFullyFund ? 0 : Math.max(0, estimatedTotal - available);

    res.status(200).json({ ...parsed, availableFunds: available, estimatedTotal, canFullyFund, shortfall });
  } catch (error) {
    console.error("❌ AI donation allocation failed:", error.message);
    res.status(500).json({ message: "AI allocation failed" });
  }
});

module.exports = router;