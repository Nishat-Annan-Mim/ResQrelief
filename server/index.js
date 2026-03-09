const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

const UserModel = require("./model/User");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

/* ---------------- MongoDB Connection ---------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

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

    // check if user exists
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // compare password
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

/* ---------------- Server ---------------- */

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
