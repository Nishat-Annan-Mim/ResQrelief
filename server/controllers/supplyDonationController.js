const SupplyDonation = require("../model/SupplyDonation");

exports.createSupply = async (req, res) => {
  try {
    const supply = new SupplyDonation({
      donorName: req.body.donorName,
      donorEmail: req.body.donorEmail,
      donorPhone: req.body.donorPhone,
      category: req.body.category,
      quantity: req.body.quantity,
      unit: req.body.unit || "pcs",
      dropLocation: req.body.dropLocation,
      dropDate: req.body.dropDate,
      dropTime: req.body.dropTime,
    });
    await supply.save();
    res.status(201).json({ message: "Supply donation scheduled!", supply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplies = async (req, res) => {
  try {
    const supplies = await SupplyDonation.find().sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const updated = await SupplyDonation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
