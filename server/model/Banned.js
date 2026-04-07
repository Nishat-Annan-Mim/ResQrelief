// model/Banned.js  — create this new file in your model/ folder
const mongoose = require("mongoose");
 
const BannedSchema = new mongoose.Schema({
  phone:     { type: String, default: "" },
  email:     { type: String, default: "" },  // submitter name/email for reference
  reason:    { type: String, default: "fraud" },
  bannedAt:  { type: Date, default: Date.now },
});
 
module.exports = mongoose.model("Banned", BannedSchema);