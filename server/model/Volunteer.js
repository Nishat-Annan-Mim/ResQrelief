const mongoose = require("mongoose");

const VolunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    dateOfBirth: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
    },

    emergencyContact: {
      type: String,
      required: true,
    },

    nidNumber: {
      type: String,
      required: true,
      unique: true,
    },

    volunteerPassword: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    preferredZone: {
      type: String,
      default: "",
    },

    volunteerRole: {
      type: String,
      default: "",
    },

    skillsExperience: {
      type: String,
      default: "",
    },

    availableFrom: {
      type: String,
      default: "",
    },

    availableUntil: {
      type: String,
      default: "",
    },

    preferredTime: {
      type: String,
      default: "",
    },

    locationSharingEnabled: {
      type: Boolean,
      default: false,
    },

    currentLatitude: {
      type: Number,
      default: null,
    },

    currentLongitude: {
      type: Number,
      default: null,
    },

    currentAddress: {
      type: String,
      default: "",
    },

    lastLocationUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const VolunteerModel = mongoose.model("volunteer", VolunteerSchema);

module.exports = VolunteerModel;
