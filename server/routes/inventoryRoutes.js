const express = require("express");
const router = express.Router();
const Inventory = require("../model/Inventory");

/* CREATE INVENTORY */

router.post("/inventory", async (req, res) => {
  try {
    const newItem = new Inventory(req.body);
    await newItem.save();

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json(err);
  }
});

/* GET ALL INVENTORY */

router.get("/inventory", async (req, res) => {
  const items = await Inventory.find();
  res.json(items);
});

/* UPDATE INVENTORY */

router.put("/inventory/:id", async (req, res) => {
  const updated = await Inventory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});

/* DELETE INVENTORY */

router.delete("/inventory/:id", async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted" });
});

module.exports = router;
