const dotenv = require("dotenv");
dotenv.config(); // MUST be first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ── Route Imports ──────────────────────────────────────────────
const authRoutes             = require("./routes/authRoutes");
const volunteerRoutes        = require("./routes/volunteerRoutes");
const aidRequestRoutes       = require("./routes/aidRequestRoutes");
const requestRoutes          = require("./routes/requestRoutes");
const aiRoutes               = require("./routes/aiRoutes");
const miscRoutes             = require("./routes/miscRoutes");    // tasks, ops, NGO, notifications, stats

// ── Already-extracted route files (unchanged) ─────────────────
const inventoryRoutes        = require("./routes/inventoryRoutes");
const alertRoutes            = require("./routes/alertRoutes");
const donationRoutes         = require("./routes/donationRoutes");
const supplyDonationRoutes   = require("./routes/supplyDonationRoutes");
const donorImpactRoutes      = require("./routes/donorImpactRoutes");
const storageAnalyticsRoutes = require("./routes/storageAnalyticsRoutes");

const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: "*" } });
global.io = io;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join", (email) => socket.join(email));
});

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// ── Database ──────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// ── Mount Routes ──────────────────────────────────────────────
app.use("/", authRoutes);
app.use("/", volunteerRoutes);
app.use("/", aidRequestRoutes);
app.use("/", requestRoutes);
app.use("/", aiRoutes);
app.use("/", miscRoutes);

// Already-extracted routes
app.use("/api", inventoryRoutes);
app.use("/api", alertRoutes);
app.use("/", donationRoutes);
app.use("/", supplyDonationRoutes);
app.use("/", donorImpactRoutes);
app.use("/", storageAnalyticsRoutes);

// ── Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});