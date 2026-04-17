const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    donorPhone: { type: String, required: true },
    donorAddress: { type: String, default: "" },
    donationType: { type: String, enum: ["money", "supplies"], required: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    supplies: [
      {
        item: { type: String, enum: ["food", "clothes", "medicine", "blankets"] },
        quantity: { type: Number },
        unit: { type: String, default: "pcs" },
      },
    ],
    transactionId: { type: String, unique: true, sparse: true },
    paymentStatus: { type: String, enum: ["pending", "success", "failed", "cancelled"], default: "pending" },
    bankTransactionId: { type: String },
    cardType: { type: String },
    storeAmount: { type: Number },
    dropOffStatus: { type: String, enum: ["scheduled", "received", "cancelled"], default: "scheduled" },
    dropOffDate: { type: Date },
    dropOffLocation: { type: String },
    isUtilized: { type: Boolean, default: false },
    utilizedAmount: { type: Number, default: 0 },
    servedArea: { type: String, default: "" },
    notes: { type: String, default: "" },
    // ADD these fields to your existing Donation.js schema
    impactSummary: { type: String, default: "" },
    impactImages: [{ type: String }], // stores image URLs or base64
    certificateGenerated: { type: Boolean, default: false },
    certificateData: {
      issuedAt: { type: Date },
      certificateId: { type: String },
      },
    },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
