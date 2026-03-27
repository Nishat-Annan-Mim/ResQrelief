const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  category: String,
  warehouseLocation: String,
  quantity: Number,
  expiryDate: Date,
  status: String
});

module.exports = mongoose.model("Inventory", InventorySchema);
