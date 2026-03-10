// model/Request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  district: { type: String, required: true },
  peopleAffected: { type: Number, required: true },
  aidTypes: { type: [String], required: true }, // Array of strings (e.g., ["Food", "Water"])
  additionalDetails: { type: String },
  status: { type: String, default: "pending" } // Used to check if a request is already pending verification
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);