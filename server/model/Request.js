const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  fullName:         { type: String, required: true },
  phoneNumber:      { type: String, required: true },
  district:         { type: String, required: true },
  fullAddress:      { type: String },
  peopleAffected:   { type: Number, required: true },
  aidTypes:         { type: [String], required: true },
  additionalDetails:{ type: String },
  otherDetails:     { type: String },
  latitude:         { type: Number },
  longitude:        { type: Number },
  email:            { type: String }, // submitter's account email (for notifications)

  status: {
    type: String,
    enum: ["pending", "verified", "in_progress", "volunteer_done", "completed"],
    default: "pending",
  },

  priority: {
    type: String,
    enum: ["HIGH", "MEDIUM", "LOW"],
    default: "MEDIUM",
  },

  // Volunteer assigned by admin
  assignedVolunteer: {
    name:  { type: String },
    email: { type: String },
    phone: { type: String },
  },

  // Chat thread between volunteer and admin
  inquiries: [{
    from:        { type: String, enum: ["volunteer", "admin"] },
    senderEmail: { type: String },
    senderName:  { type: String },
    message:     { type: String },
    sentAt:      { type: Date, default: Date.now },
  }],

  completedAt: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);