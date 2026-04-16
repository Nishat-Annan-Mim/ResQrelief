const mongoose = require("mongoose");

const VolunteerTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    taskType: {
      type: String,
      enum: ["Food Distribution", "Medical Aid", "Transport Coordination", "Shelter Setup", "Search & Rescue", "Water Supply", "Communication", "Logistics"],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    assignedTo: {
      volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "volunteer", default: null },
      volunteerName: { type: String, default: "" },
      volunteerEmail: { type: String, default: "" },
    },

    zone: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    completionNote: {
      type: String,
      default: "",
    },

    createdByAdmin: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("volunteertask", VolunteerTaskSchema);