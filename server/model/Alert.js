const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  alertTitle: String,
  message: String,

  audience: [String], // ["volunteers", "beneficiaries"]
  channels: [String], // ["app", "email"]

  recipients: [String], // emails 
  dateSent: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    default: "Sent",
  },
});

module.exports = mongoose.model("Alert", AlertSchema);