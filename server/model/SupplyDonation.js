const mongoose = require("mongoose");

const supplyDonationSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    donorPhone: { type: String, required: true },
    category: { type: String, enum: ["food", "clothes", "medicine", "blankets"], required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "pcs" },
    dropLocation: { type: String, required: true },
    dropDate: { type: String, required: true },
    dropTime: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "received", "cancelled"], default: "scheduled" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplyDonation", supplyDonationSchema);
