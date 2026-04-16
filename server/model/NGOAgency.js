const mongoose = require("mongoose");

const NGOAgencySchema = new mongoose.Schema(
  {
    agencyName: {
      type: String,
      required: true,
    },

    agencyType: {
      type: String,
      enum: ["NGO", "Government", "UN Agency", "Red Cross/Crescent", "Hospital", "Military", "Community Org", "Other"],
      required: true,
    },

    contactPerson: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    registrationNumber: {
      type: String,
      default: "",
    },

    resourcesAvailable: {
      type: [String],
      default: [],
    },

    password: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ngoagency", NGOAgencySchema);