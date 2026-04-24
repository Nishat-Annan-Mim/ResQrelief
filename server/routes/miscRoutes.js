const express = require("express");
const router = express.Router();
const VolunteerTaskModel = require("../model/VolunteerTask");
const OperationModel = require("../model/Operation");
const OperationRouteModel = require("../model/OperationRoute");
const NGOAgencyModel = require("../model/NGOAgency");
const CollabPostModel = require("../model/CollabPost");
const NotificationModel = require("../model/Notification");
const VolunteerModel = require("../model/Volunteer");
const DonationModel = require("../model/Donation");
const bcrypt = require("bcrypt");

/* ================================================================
   TASK ROUTES (Feature 4 — Volunteer Task Management)
   ================================================================ */

// Create task (Admin)
router.post("/api/tasks", async (req, res) => {
  try {
    const task = new VolunteerTaskModel(req.body);
    await task.save();
    res.status(201).json(task);

    if (task.assignedTo?.volunteerEmail) {
      try {
        const notification = new NotificationModel({
          recipientEmail: task.assignedTo.volunteerEmail,
          title: `New Task Assigned: ${task.title}`,
          message: `You have been assigned a new task: "${task.title}" (${task.taskType}) — Priority: ${task.priority.toUpperCase()}`,
          type: "task",
          link: "/volunteer-tasks",
        });
        await notification.save();
        if (global.io) global.io.to(task.assignedTo.volunteerEmail).emit("new-notification", notification);
      } catch (notifErr) {
        console.error("Notification failed (non-critical):", notifErr.message);
      }
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to create task" });
  }
});

// Get all tasks (Admin)
router.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await VolunteerTaskModel.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// Get tasks for a specific request
router.get("/api/tasks/request/:requestId", async (req, res) => {
  try {
    const tasks = await VolunteerTaskModel.find({ requestId: req.params.requestId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch request tasks" });
  }
});

// Get tasks for a specific volunteer
router.get("/api/tasks/volunteer/:email", async (req, res) => {
  try {
    const tasks = await VolunteerTaskModel.find({
      "assignedTo.volunteerEmail": req.params.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch volunteer tasks" });
  }
});

// Update task status
router.put("/api/tasks/:id/status", async (req, res) => {
  try {
    const { status, completionNote } = req.body;
    const updated = await VolunteerTaskModel.findByIdAndUpdate(
      req.params.id,
      { status, ...(completionNote ? { completionNote } : {}) },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task status" });
  }
});

// Update full task (Admin edit)
router.put("/api/tasks/:id", async (req, res) => {
  try {
    const updated = await VolunteerTaskModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task" });
  }
});

// Delete task (Admin)
router.delete("/api/tasks/:id", async (req, res) => {
  try {
    await VolunteerTaskModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task" });
  }
});

/* ================================================================
   OPERATION ROUTES
   ================================================================ */

router.post("/api/operations", async (req, res) => {
  try {
    const op = new OperationModel(req.body);
    await op.save();
    res.status(201).json(op);
  } catch (err) {
    res.status(500).json({ message: "Failed to create operation" });
  }
});

router.get("/api/operations", async (req, res) => {
  try {
    const ops = await OperationModel.find().sort({ createdAt: -1 });
    res.status(200).json(ops);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch operations" });
  }
});

router.get("/api/operations/volunteer/:email", async (req, res) => {
  try {
    const ops = await OperationModel.find({
      "volunteers.volunteerEmail": req.params.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(ops);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch volunteer operations" });
  }
});

router.put("/api/operations/:id/status", async (req, res) => {
  try {
    const updated = await OperationModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { returnDocument: "after" },
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.delete("/api/operations/:id", async (req, res) => {
  try {
    await OperationModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Operation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete operation" });
  }
});

// Operation Route save/get/clear
router.post("/api/operation-route/:operationId", async (req, res) => {
  try {
    const { routePoints, savedBy, operationName } = req.body;
    const route = await OperationRouteModel.findOneAndUpdate(
      { operationId: req.params.operationId },
      { operationId: req.params.operationId, operationName, savedBy, routePoints },
      { upsert: true, returnDocument: "after" },
    );
    res.status(200).json(route);
  } catch (err) {
    res.status(500).json({ message: "Failed to save route" });
  }
});

router.get("/api/operation-route/:operationId", async (req, res) => {
  try {
    const route = await OperationRouteModel.findOne({ operationId: req.params.operationId });
    res.status(200).json(route || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch route" });
  }
});

router.delete("/api/operation-route/:operationId", async (req, res) => {
  try {
    await OperationRouteModel.findOneAndDelete({ operationId: req.params.operationId });
    res.status(200).json({ message: "Route cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear route" });
  }
});

/* ================================================================
   NGO & COLLABORATION ROUTES
   ================================================================ */

router.post("/api/ngo/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await NGOAgencyModel.findOne({ email });
    if (existing) return res.status(400).json({ message: "Agency with this email already registered" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const agency = new NGOAgencyModel({ ...req.body, password: hashedPassword });
    await agency.save();
    res.status(201).json({ message: "Agency registered. Awaiting admin verification.", agency });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/api/ngo/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const agency = await NGOAgencyModel.findOne({ email });
    if (!agency) return res.status(404).json({ message: "Agency not found" });
    if (agency.status !== "verified") return res.status(403).json({ message: "Your agency is not yet verified by admin." });
    const isMatch = await bcrypt.compare(password, agency.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });
    res.status(200).json({ message: "Login successful", agency: { ...agency._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/api/ngo/agencies", async (req, res) => {
  try {
    const agencies = await NGOAgencyModel.find().sort({ createdAt: -1 });
    res.status(200).json(agencies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch agencies" });
  }
});

router.put("/api/ngo/agencies/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await NGOAgencyModel.findByIdAndUpdate(
      req.params.id,
      { status, isVerified: status === "verified" },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update agency status" });
  }
});

router.get("/api/collab/posts", async (req, res) => {
  try {
    const posts = await CollabPostModel.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

router.post("/api/collab/posts", async (req, res) => {
  try {
    const post = new CollabPostModel(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

router.post("/api/collab/posts/:id/respond", async (req, res) => {
  try {
    const post = await CollabPostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.responses.push(req.body);
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to respond" });
  }
});

router.put("/api/collab/posts/:id/status", async (req, res) => {
  try {
    const updated = await CollabPostModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update post status" });
  }
});

router.delete("/api/collab/posts/:id", async (req, res) => {
  try {
    await CollabPostModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post" });
  }
});

/* ================================================================
   NOTIFICATION ROUTES
   ================================================================ */

// IMPORTANT: Specific paths must come before parameterized /:email
router.put("/api/notifications/read-all/:email", async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { recipientEmail: req.params.email, read: false },
      { read: true }
    );
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/api/notifications/read/:id", async (req, res) => {
  try {
    await NotificationModel.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/notifications/:email", async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      recipientEmail: req.params.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================================================================
   STATS ROUTE
   ================================================================ */

router.get("/api/stats", async (req, res) => {
  try {
    const volunteerCount = await VolunteerModel.countDocuments({
      status: "confirmed",
      profileCompleted: true,
    });

    const collected = await DonationModel.aggregate([
      { $match: { donationType: "money", paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const utilized = await DonationModel.aggregate([
      { $match: { donationType: "money", isUtilized: true } },
      { $group: { _id: null, total: { $sum: "$utilizedAmount" } } },
    ]);
    const availableFunds = (collected[0]?.total || 0) - (utilized[0]?.total || 0);

    res.status(200).json({ volunteerCount, availableFunds });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;