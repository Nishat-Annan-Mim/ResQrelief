

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

const UserModel = require("./model/User");
const VolunteerModel = require("./model/Volunteer");
const AidRequestModel = require("./model/AidRequest");
const RequestModel = require("./model/Request");
const inventoryRoutes = require("./routes/inventoryRoutes");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api", inventoryRoutes);

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

    const existingVolunteer = await VolunteerModel.findOne({
      $or: [{ email }, { nidNumber }],
    });

    if (existingVolunteer) {
      return res.status(400).json({
        message: "Volunteer already exists with this email or NID",
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

/* ---------------- Aid Request API ---------------- */

app.post("/api/requests", async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      district,
      peopleAffected,
      aidTypes,
      additionalDetails,
    } = req.body;

    // 1. Check for duplicate pending requests with the same phone number
    const existingPending = await RequestModel.findOne({
      phoneNumber,
      status: "pending",
    });

    if (existingPending) {
      // Sending a 409 status and duplicate flag triggers the error modal in your React code
      return res.status(409).json({
        message: "This number has already requested",
        duplicate: true,
      });
    }

    // 2. Save the new aid request to the database
    const newRequest = new RequestModel({
      fullName,
      phoneNumber,
      district,
      peopleAffected,
      aidTypes,
      additionalDetails,
    });

    await newRequest.save();

    res.status(201).json({
      message: "Request submitted successfully",
      duplicate: false,
    });
  } catch (error) {
    console.log("Error submitting request:", error);
    res.status(500).json({
      message: "Server error while submitting request",
    });
  }
});

/* ---------------- Server ---------------- */

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
