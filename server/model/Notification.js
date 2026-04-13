const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true },
  title:          { type: String, required: true },
  message:        { type: String, required: true },
  type:           { type: String }, // "request_verified" | "volunteer_assigned" | "alert"
  link:           { type: String }, // where to go when clicked
  read:           { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);