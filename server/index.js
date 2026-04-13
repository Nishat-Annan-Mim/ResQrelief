const dotenv = require("dotenv");
dotenv.config(); // ← MUST be first, before any other require

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

// const dotenv = require("dotenv");

const UserModel = require("./model/User");
const VolunteerModel = require("./model/Volunteer");
const AidRequestModel = require("./model/AidRequest");
const RequestModel = require("./model/Request");
const inventoryRoutes = require("./routes/inventoryRoutes");
const alertRoutes = require("./routes/alertRoutes");
const donationRoutes = require("./routes/donationRoutes");
const supplyDonationRoutes = require("./routes/supplyDonationRoutes");
const OperationModel = require("./model/Operation");

const app = express();
const BannedModel = require("./model/Banned");

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

global.io = io;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (email) => {
    socket.join(email);
  });
});

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  }),
);

//app.use(cors());
app.use("/api", inventoryRoutes);
app.use("/api", alertRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};

/* ---------------- Signup API ---------------- */

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

/* ---------------- Login API ---------------- */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

/* ---------------- Volunteer Check ---------------- */

app.get("/volunteer/check/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const volunteer = await VolunteerModel.findOne({ email });

    if (volunteer) {
      return res.status(200).json({
        isVolunteer: true,
        profileCompleted: volunteer.profileCompleted,
        volunteer,
      });
    }

    return res.status(200).json({
      isVolunteer: false,
      profileCompleted: false,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer Registration ---------------- */

app.post("/volunteer/register", async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      dateOfBirth,
      phone,
      address,
      gender,
      emergencyContact,
      nidNumber,
      volunteerPassword,
    } = req.body;

    // First, check if the email exists
    const existingVolunteerByEmail = await VolunteerModel.findOne({ email });
    if (existingVolunteerByEmail) {
      return res.status(400).json({
        message: "Volunteer already exists with this email",
      });
    }

    // Then check if the NID exists
    const existingVolunteerByNID = await VolunteerModel.findOne({ nidNumber });
    if (existingVolunteerByNID) {
      return res.status(400).json({
        message: "Volunteer already exists with this NID",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let hashedVolunteerPassword = "";
    if (volunteerPassword) {
      hashedVolunteerPassword = await bcrypt.hash(volunteerPassword, 10);
    }

    const newVolunteer = new VolunteerModel({
      userId,
      fullName,
      email,
      dateOfBirth,
      phone,
      address,
      gender,
      emergencyContact,
      nidNumber,
      volunteerPassword: hashedVolunteerPassword,
      profileCompleted: false,
      status: "pending",
    });

    await newVolunteer.save();

    res.status(201).json({
      message: "Volunteer registered successfully",
      volunteer: newVolunteer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
/* ---------------- Volunteer Profile ---------------- */

app.get("/volunteer/profile/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const volunteer = await VolunteerModel.findOne({ email });

    if (!volunteer) {
      return res.status(404).json({
        message: "Volunteer not found",
      });
    }

    res.status(200).json(volunteer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Save Zone ---------------- */

app.put("/volunteer/zone/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { preferredZone } = req.body;

    const updatedVolunteer = await VolunteerModel.findOneAndUpdate(
      { email },
      { preferredZone },
      { returnDocument: "after" },
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.json({
      message: "Zone updated successfully",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Save Role Setup ---------------- */

app.put("/volunteer/role-setup/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const {
      volunteerRole,
      skillsExperience,
      availableFrom,
      availableUntil,
      preferredTime,
    } = req.body;

    const updatedVolunteer = await VolunteerModel.findOneAndUpdate(
      { email },
      {
        volunteerRole,
        skillsExperience,
        availableFrom,
        availableUntil,
        preferredTime,
        profileCompleted: true,
      },
      { returnDocument: "after" },
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.json({
      message: "Volunteer role setup completed",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer General Update ---------------- */

app.put("/volunteer/update/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const updatedVolunteer = await VolunteerModel.findOneAndUpdate(
      { email },
      req.body,
      { returnDocument: "after" },
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.json({
      message: "Volunteer profile updated",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- All Volunteers Grouped By Zone ---------------- */

app.get("/volunteers/grouped-by-zone", async (req, res) => {
  try {
    const volunteers = await VolunteerModel.find(
      {
        profileCompleted: true,
        preferredZone: { $ne: "" },
      },
      {
        fullName: 1,
        email: 1,
        phone: 1,
        preferredZone: 1,
        volunteerRole: 1,
        availableFrom: 1,
        availableUntil: 1,
        preferredTime: 1,
      },
    ).sort({ preferredZone: 1, fullName: 1 });

    const grouped = volunteers.reduce((acc, volunteer) => {
      const zone = volunteer.preferredZone || "Unassigned";

      if (!acc[zone]) {
        acc[zone] = [];
      }

      acc[zone].push(volunteer);
      return acc;
    }, {});

    res.status(200).json(grouped);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Volunteer Share Location ---------------- */

app.put("/volunteer/location/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { lat, lng, address } = req.body;

    const updatedVolunteer = await VolunteerModel.findOneAndUpdate(
      { email },
      {
        locationSharingEnabled: true,
        currentLatitude: Number(lat),
        currentLongitude: Number(lng),
        currentAddress: address || "",
        lastLocationUpdatedAt: new Date(),
      },
      { returnDocument: "after" },
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.status(200).json({
      message: "Location shared successfully",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/volunteer/location/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const updatedVolunteer = await VolunteerModel.findOneAndUpdate(
      { email },
      {
        locationSharingEnabled: false,
        currentLatitude: null,
        currentLongitude: null,
        currentAddress: "",
        lastLocationUpdatedAt: null,
      },
      { returnDocument: "after" },
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.status(200).json({
      message: "Shared location removed",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/volunteer/locations", async (req, res) => {
  try {
    const volunteers = await VolunteerModel.find(
      {
        locationSharingEnabled: true,
        currentLatitude: { $ne: null },
        currentLongitude: { $ne: null },
      },
      {
        fullName: 1,
        email: 1,
        preferredZone: 1,
        volunteerRole: 1,
        currentLatitude: 1,
        currentLongitude: 1,
        currentAddress: 1,
        lastLocationUpdatedAt: 1,
      },
    ).sort({ lastLocationUpdatedAt: -1 });

    res.status(200).json(volunteers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Aid Requests ---------------- */

app.post("/aid-requests", async (req, res) => {
  try {
    const {
      createdByVolunteerId,
      createdByVolunteerName,
      createdByVolunteerEmail,
      requestType,
      severity,
      description,
      latitude,
      longitude,
      address,
    } = req.body;

    const newRequest = new AidRequestModel({
      createdByVolunteerId,
      createdByVolunteerName,
      createdByVolunteerEmail,
      requestType,
      severity,
      description,
      latitude,
      longitude,
      address,
      status: "need",
    });

    await newRequest.save();

    res.status(201).json({
      message: "Aid request created successfully",
      request: newRequest,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/aid-requests", async (req, res) => {
  try {
    const requests = await AidRequestModel.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/aid-requests/nearby/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const volunteer = await VolunteerModel.findOne({ email });

    if (
      !volunteer ||
      volunteer.currentLatitude === null ||
      volunteer.currentLongitude === null
    ) {
      return res
        .status(400)
        .json({ message: "Volunteer location not shared yet" });
    }

    const requests = await AidRequestModel.find({
      createdByVolunteerEmail: { $ne: email },
    }).sort({ createdAt: -1 });

    const nearbyRequests = requests
      .map((request) => {
        const distanceKm = haversineDistanceKm(
          volunteer.currentLatitude,
          volunteer.currentLongitude,
          request.latitude,
          request.longitude,
        );

        return {
          ...request.toObject(),
          distanceKm,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json(nearbyRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/aid-requests/:requestId/accept", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { helperVolunteerId, helperVolunteerName, helperVolunteerEmail } =
      req.body;

    const request = await AidRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const updatedRequest = await AidRequestModel.findByIdAndUpdate(
      requestId,
      {
        status: "helping",
        helperVolunteerId,
        helperVolunteerName,
        helperVolunteerEmail,
        helperMessage: `Coming for help... Volunteer ${helperVolunteerName} is on the way.`,
      },
      { returnDocument: "after" },
    );

    res.status(200).json({
      message: "Request accepted successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/aid-requests/:requestId/helped", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { helperVolunteerEmail } = req.body;

    const request = await AidRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.helperVolunteerEmail !== helperVolunteerEmail) {
      return res
        .status(403)
        .json({ message: "Only the assigned helper can mark this helped" });
    }

    const updatedRequest = await AidRequestModel.findByIdAndUpdate(
      requestId,
      {
        status: "helped",
        helperMessage: "This request has already received help.",
      },
      { returnDocument: "after" },
    );

    res.status(200).json({
      message: "Request marked as helped",
      request: updatedRequest,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/aid-requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { requesterEmail } = req.body;

    const request = await AidRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.createdByVolunteerEmail !== requesterEmail) {
      return res.status(403).json({
        message: "Only the volunteer who created this request can delete it",
      });
    }

    await AidRequestModel.findByIdAndDelete(requestId);

    res.status(200).json({
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// ADD THESE ROUTES TO YOUR index.js (replace or supplement existing ones)
// ============================================================

// ── GET volunteers by district (for admin assign panel) ──────
app.get("/api/volunteers/by-district/:district", async (req, res) => {
  try {
    const { district } = req.params;
    const volunteers = await VolunteerModel.find({
      profileCompleted: true,
      preferredZone: { $regex: new RegExp(district, "i") },
      isBanned: { $ne: true },
    }).select(
      "fullName email phone volunteerRole preferredZone preferredTime availableFrom availableUntil",
    );
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// // ── GET all volunteers (for admin, no district filter) ───────
// app.get("/api/volunteers/all", async (req, res) => {
//   try {
//     const volunteers = await VolunteerModel.find({
//       profileCompleted: true,
//       isBanned: { $ne: true },
//     }).select("fullName email phone volunteerRole preferredZone preferredTime");
//     res.status(200).json(volunteers);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// ── VERIFY request + optionally assign a volunteer ───────────
// REPLACE your existing PUT /api/requests/:id/verify with this:
app.put("/api/requests/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedVolunteer } = req.body; // optional { name, email, phone }

    console.time(`verify-${id}`);
    const update = {
      status: "verified",
      ...(assignedVolunteer && { assignedVolunteer }),
    };

    const updated = await RequestModel.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    });
    console.timeEnd(`verify-${id}`);

    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ── FRAUD: ban phone+email, delete request ───────────────────
// REPLACE your existing DELETE /api/requests/:id with this:
app.delete("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.time(`fraud-${id}`);

    const request = await RequestModel.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Ban the phone number and email
    await BannedModel.findOneAndUpdate(
      { $or: [{ phone: request.phoneNumber }, { email: request.fullName }] },
      {
        phone: request.phoneNumber,
        email: request.fullName, // store submitter name too for reference
        bannedAt: new Date(),
        reason: "fraud",
      },
      { upsert: true, new: true },
    );

    // Also ban the volunteer account if one exists with this phone
    await VolunteerModel.findOneAndUpdate(
      { phone: request.phoneNumber },
      { isBanned: true },
    );
    await UserModel.findOneAndUpdate(
      { email: request.phoneNumber }, // in case email matches
      { isBanned: true },
    );

    await RequestModel.findByIdAndDelete(id);
    console.timeEnd(`fraud-${id}`);

    res
      .status(200)
      .json({ message: "Request marked as fraud, submitter banned" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET requests filtered by status ─────────────────────────
app.get("/api/requests/by-status/:status", async (req, res) => {
  try {
    const { status } = req.params; // "verified" | "pending" | "fraud"
    const requests = await RequestModel.find({ status }).sort({
      createdAt: -1,
    });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET banned list ──────────────────────────────────────────
app.get("/api/banned", async (req, res) => {
  try {
    const banned = await BannedModel.find().sort({ bannedAt: -1 });
    res.status(200).json(banned);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── CHECK if phone is banned (use in AidRequestForm before submit) ──
app.get("/api/banned/check/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const banned = await BannedModel.findOne({ phone });
    res.status(200).json({ isBanned: !!banned });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Aid Request API ---------------- */

app.post("/api/requests", async (req, res) => {
  try {
    const requestData = req.body;
    // ✅ ADD THIS — check if phone is banned FIRST
    const isBanned = await BannedModel.findOne({
      phone: requestData.phoneNumber,
    });
    if (isBanned) {
      return res.status(403).json({
        message: "This number has been banned due to a fraudulent request.",
        banned: true,
      });
    }
    let assignedPriority = "MEDIUM"; // Default fallback

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

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:free", // ← changed again
            messages: [{ role: "user", content: prompt }],
          }),
        },
      );

      const data = await response.json();
      console.log("FULL AI RESPONSE:", data);

      // ✅ HANDLE ERROR RESPONSE
      if (data.error) {
        throw new Error(data.error.message);
      }

      // ✅ SAFE ACCESS
      let text = data?.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error("No AI text returned");
      }
      // 👇 THIS TELLS US WHAT THE AI SAID 👇
      console.log("🤖 AI Raw Answer:", text);

      const match = text.match(/(HIGH|MEDIUM|LOW)/i);
      if (match) {
        assignedPriority = match[1].toUpperCase();
      }

      // 👇 THIS TELLS US WHAT SAVED TO MONGODB 👇
      console.log("✅ Final Saved Priority:", assignedPriority);
    } catch (aiError) {
      // 👇 THIS TELLS US IF THE API KEY FAILED 👇
      console.error("❌ AI Priority Generation Failed:", aiError.message);
    }

    const newRequest = new RequestModel({
      ...requestData,
      priority: assignedPriority,
    });

    await newRequest.save();
    res
      .status(201)
      .json({ message: "Request submitted successfully", request: newRequest });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// TEMPORARY - run once to create admin, then delete this route
app.post("/create-admin", async (req, res) => {
  const hashed = await bcrypt.hash("Admin123@321", 10);
  const admin = new UserModel({
    name: "Admin",
    email: "admin1@resqrelief.com",
    password: hashed,
    role: "admin",
  });
  await admin.save();
  res.json({ message: "Admin created" });
});

/* ---------------- AI Prioritize Requests ---------------- */

app.get("/api/requests/ai-prioritized", async (req, res) => {
  try {
    const rawRequests = await RequestModel.find()
      .lean()
      .sort({ createdAt: -1 });

    // ✅ FIX: Actually apply "MEDIUM" to older items in the array so the UI shows it
    const requests = rawRequests.map((req) => ({
      ...req,
      priority: req.priority || "MEDIUM",
    }));

    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    requests.sort((a, b) => {
      const priorityA = order[a.priority];
      const priorityB = order[b.priority];
      return priorityA - priorityB;
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- AI Resource Allocation ---------------- */

/* ---------------- AI Resource Allocation ---------------- */

app.post("/api/ai/resource-allocation", async (req, res) => {
  try {
    // 🚨 SAFETY CHECK: Ensure the API key is actually loaded
    if (!process.env.OPENROUTER_API_KEY) {
      console.error(
        "❌ FATAL: OPENROUTER_API_KEY is undefined in resource-allocation!",
      );
      return res
        .status(500)
        .json({ message: "Server configuration error: Missing API Key" });
    }

    const { aidTypes, peopleAffected, district, description } = req.body;

    const inventory = await require("./model/Inventory").find();
    const inventorySummary = inventory
      .map(
        (item) =>
          `${item.itemName} (${item.category}): ${item.quantity} units, Status: ${item.status}`,
      )
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

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // OpenRouter requires this for free models
          "X-Title": "ResQrelief", // OpenRouter requires this for free models
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    let text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No AI text returned");

    text = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    res.status(200).json(parsed);
  } catch (error) {
    console.error("❌ AI resource allocation failed:", error.message);
    res.status(500).json({ message: "AI resource allocation failed" });
  }
});

/* ---------------- AI Skill-Based Volunteer Matching ---------------- */

/* ---------------- AI Skill-Based Volunteer Matching ---------------- */

app.post("/api/ai/volunteer-match", async (req, res) => {
  try {
    // 🚨 SAFETY CHECK: Ensure the API key is actually loaded
    if (!process.env.OPENROUTER_API_KEY) {
      console.error(
        "❌ FATAL: OPENROUTER_API_KEY is undefined in volunteer-match!",
      );
      return res
        .status(500)
        .json({ message: "Server configuration error: Missing API Key" });
    }

    const { aidTypes, peopleAffected, district, description } = req.body;

    const volunteers = await VolunteerModel.find({ profileCompleted: true });
    const volunteerSummary = volunteers
      .map(
        (v) =>
          `Name: ${v.fullName}, Role: ${v.volunteerRole}, Skills: ${v.skillsExperience || "None"}, Zone: ${v.preferredZone}, Availability: ${v.preferredTime || "Flexible"}`,
      )
      .join("\n");

    const prompt = `
You are a disaster relief volunteer matching AI.

A request has come in:
- Location: ${district}
- Aid Types Needed: ${aidTypes?.join(", ")}
- People Affected: ${peopleAffected}
- Description: ${description || "No description"}

Available volunteers:
${volunteerSummary}

Match the TOP 3 best volunteers for this request based on their skills, role, and proximity.
Reply in this exact JSON format only, no extra text:
{
  "matches": [
    {
      "name": "Volunteer Name",
      "reason": "Why this volunteer is the best match",
      "matchScore": 95
    }
  ],
  "summary": "One sentence about why these volunteers were selected"
}
    `;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // OpenRouter requires this for free models
          "X-Title": "ResQrelief", // OpenRouter requires this for free models
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    let text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No AI text returned");

    text = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    res.status(200).json(parsed);
  } catch (error) {
    console.error("❌ AI volunteer matching failed:", error.message);
    res.status(500).json({ message: "AI volunteer matching failed" });
  }
});

/* ---------------- NID Management ---------------- */
const fs = require("fs");
const path = require("path");

// Serve the NID numbers from the .txt file
app.get("/valid-nids", (req, res) => {
  const filePath = path.join(__dirname, "validNidNumbers.txt");

  // Read the file and return the NIDs as an array
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading NID file" });
    }

    // Split the file contents by new lines, trim each line, and filter out any empty lines
    const nids = data
      .split("\n") // Split by new line
      .map((nid) => nid.trim()) // Remove any extra whitespace or carriage return
      .filter((nid) => nid !== ""); // Filter out empty lines

    res.json(nids);
  });
});

/* ---------------- volunteerlogin ---------------- */
app.post("/volunteer/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const volunteer = await VolunteerModel.findOne({ email });

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    const isMatch = await bcrypt.compare(password, volunteer.volunteerPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- adminconfiemvolunteer ---------------- */

app.put("/api/volunteer/confirm/:id", async (req, res) => {
  try {
    const volunteerId = req.params.id;

    // Update the volunteer status to 'confirmed'
    const updatedVolunteer = await VolunteerModel.findByIdAndUpdate(
      volunteerId,
      { status: "confirmed" },
      { returnDocument: "after" },
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.status(200).json({
      message: "Volunteer confirmed successfully",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Get All Volunteers (Admin) ---------------- */
app.get("/api/volunteers/all", async (req, res) => {
  try {
    const volunteers = await VolunteerModel.find();
    res.status(200).json(volunteers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Remove Volunteer (Admin) ---------------- */
app.delete("/api/volunteer/remove/:id", async (req, res) => {
  try {
    const volunteerId = req.params.id;

    const deleted = await VolunteerModel.findByIdAndDelete(volunteerId);

    if (!deleted) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.status(200).json({ message: "Volunteer removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Cancel Aid Request from map (Helper Volunteer) ---------------- */
/* ---------------- Cancel Aid Request from map (Helper Volunteer) ---------------- */
app.put("/aid-requests/:id/cancel", async (req, res) => {
  try {
    const { cancellerEmail } = req.body;
    const request = await AidRequestModel.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.helperVolunteerEmail !== cancellerEmail) {
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

/* ---------------- Admin: Get All Aid Requests ---------------- */
app.get("/api/admin/aid-requests", async (req, res) => {
  try {
    const requests = await AidRequestModel.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Admin: Delete Any Aid Request ---------------- */
app.delete("/api/admin/aid-requests/:id", async (req, res) => {
  try {
    const deleted = await AidRequestModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- relief operation ---------------- */
// SF1: Admin creates an operation assigned to a volunteer
app.post("/api/operations", async (req, res) => {
  try {
    const op = new OperationModel(req.body);
    await op.save();
    res.status(201).json(op);
  } catch (err) {
    res.status(500).json({ message: "Failed to create operation" });
  }
});

// SF1+SF2: Admin gets ALL operations (for dashboard)
app.get("/api/operations", async (req, res) => {
  try {
    const ops = await OperationModel.find().sort({ createdAt: -1 });
    res.status(200).json(ops);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch operations" });
  }
});

// SF3: Volunteer gets their own operations (by email)
app.get("/api/operations/volunteer/:email", async (req, res) => {
  try {
    const ops = await OperationModel.find({
      "volunteers.volunteerEmail": req.params.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(ops);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch volunteer operations" });
  }
});

// SF2: Volunteer updates status
app.put("/api/operations/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await OperationModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// SF1: Admin deletes an operation
// SF1: Admin deletes an operation
app.delete("/api/operations/:id", async (req, res) => {
  try {
    await OperationModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Operation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete operation" });
  }
});

/* ---------------- route save ---------------- */
const OperationRouteModel = require("./model/OperationRoute");

// Save or update route for an operation
app.post("/api/operation-route/:operationId", async (req, res) => {
  try {
    const { operationId } = req.params;
    const { routePoints, savedBy, operationName } = req.body;

    const route = await OperationRouteModel.findOneAndUpdate(
      { operationId },
      { operationId, operationName, savedBy, routePoints },
      { upsert: true, returnDocument: "after" },
    );

    res.status(200).json(route);
  } catch (err) {
    res.status(500).json({ message: "Failed to save route" });
  }
});

// Get saved route for an operation
app.get("/api/operation-route/:operationId", async (req, res) => {
  try {
    const route = await OperationRouteModel.findOne({
      operationId: req.params.operationId,
    });
    res.status(200).json(route || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch route" });
  }
});

// Clear saved route for an operation
app.delete("/api/operation-route/:operationId", async (req, res) => {
  try {
    await OperationRouteModel.findOneAndDelete({
      operationId: req.params.operationId,
    });
    res.status(200).json({ message: "Route cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear route" });
  }
});
/* ---------------- Donation Routes ---------------- */
app.use("/", donationRoutes);
app.use("/", supplyDonationRoutes);

//const PORT = process.env.PORT || 3001;
//app.listen(PORT, () => {
// console.log(`Server running on port ${PORT}`);
//});

/* ---------------- Server ---------------- */

//server.listen(process.env.PORT, () => {
//  console.log(`Server running on port ${process.env.PORT}`);
//});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
