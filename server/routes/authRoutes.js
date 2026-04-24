const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const UserModel = require("../model/User");
const BannedModel = require("../model/Banned");

/* ---------------- Signup ---------------- */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const isBanned = await BannedModel.findOne({ email });
    if (isBanned) {
      return res.status(403).json({
        message: "This email has been banned and cannot be used to create an account.",
        banned: true,
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      if (existingUser.isBanned) {
        return res.status(403).json({
          message: "This email has been banned and cannot be used to create an account.",
          banned: true,
        });
      }
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Login ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts must log in through the admin portal.",
        adminOnly: true,
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been suspended due to a fraudulent request.",
        banned: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Admin Login ---------------- */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin accounts can access the admin portal.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({
      message: "Admin login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Create Admin (TEMPORARY - delete after use) ---------------- */
router.post("/create-admin", async (req, res) => {
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

module.exports = router;