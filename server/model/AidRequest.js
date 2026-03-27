const mongoose = require("mongoose");

const AidRequestSchema = new mongoose.Schema(
  {
    createdByVolunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "volunteer",
      required: true,
    },

    createdByVolunteerName: {
      type: String,
      required: true,
    },

    createdByVolunteerEmail: {
      type: String,
      required: true,
    },

    requestType: {
      type: String,
      enum: ["Medical", "Food", "Shelter", "Water", "Rescue", "Clothes"],
      required: true,
    },

    severity: {
      type: String,
      enum: ["emergency", "medium", "low"],
      default: "medium",
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["need", "helping", "helped"],
      default: "need",
    },

    helperVolunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "volunteer",
      default: null,
    },

    helperVolunteerName: {
      type: String,
      default: "",
    },

    helperVolunteerEmail: {
      type: String,
      default: "",
    },

    helperMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const AidRequestModel = mongoose.model("aidrequest", AidRequestSchema);

module.exports = AidRequestModel;
