// model/Request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  district: { type: String, required: true },
  peopleAffected: { type: Number, required: true },
  aidTypes: { type: [String], required: true }, 
  additionalDetails: { type: String },
  status: { type: String, default: "pending" }, 
  // ✅ NEW: Added priority field to save to database
  priority: { 
    type: String, 
    enum: ["HIGH", "MEDIUM", "LOW"], 
    default: "MEDIUM" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);