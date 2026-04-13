const mongoose = require("mongoose");

const OperationSchema = new mongoose.Schema(
  {
    operationName: { type: String, required: true },

    // ── Multiple volunteers ──
    volunteers: [
      {
        volunteerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "volunteer",
        },
        volunteerName: { type: String },
        volunteerEmail: { type: String },
      },
    ],

    supplyPickupPoint: { type: String, default: "" },
    locations: [
      {
        name: { type: String },
        supplies: [{ type: String }],
      },
    ],
    scheduledDate: { type: String },
    departureTime: { type: String },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "On the way", "Arrived", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Operation", OperationSchema);
