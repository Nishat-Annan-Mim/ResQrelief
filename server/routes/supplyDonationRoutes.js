const express = require("express");
const router = express.Router();
const controller = require("../controllers/supplyDonationController");

router.post("/donate-supply", controller.createSupply);
router.get("/donate-supply", controller.getSupplies);
router.patch("/donate-supply/:id", controller.updateStatus);

module.exports = router;
