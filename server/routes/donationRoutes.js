const express = require("express");
const router = express.Router();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const DonationModel = require("../model/Donation");

const STORE_ID = process.env.SSLCZ_STORE_ID;
const STORE_PASS = process.env.SSLCZ_STORE_PASSWORD;
const BASE_URL = process.env.SSLCZ_BASE_URL;
const VALIDATE_URL = process.env.SSLCZ_VALIDATE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

router.post("/donate/money", async (req, res) => {
  console.log("🔥 Request received:", req.body);
  try {
    const { donorName, donorEmail, donorPhone, donorAddress, amount } = req.body;
    if (!amount || amount < 10) {
      return res.status(400).json({ message: "Minimum donation amount is 10 BDT" });
    }
    const transactionId = "TXN-" + uuidv4().replace(/-/g, "").toUpperCase().slice(0, 16);
    const donation = new DonationModel({
      donorName, donorEmail, donorPhone, donorAddress,
      donationType: "money", amount, transactionId, paymentStatus: "pending",
    });
    await donation.save();
    const payload = new URLSearchParams({
      store_id: STORE_ID,
      store_passwd: STORE_PASS,
      total_amount: amount,
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${BACKEND_URL}/payment/success`,
      fail_url: `${BACKEND_URL}/payment/fail`,
      cancel_url: `${BACKEND_URL}/payment/cancel`,
      cus_name: donorName,
      cus_email: donorEmail,
      cus_add1: donorAddress || "N/A",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: donorPhone,
      product_name: "Disaster Relief Donation",
      product_category: "Donation",
      product_profile: "non-physical-goods",
      shipping_method: "NO",
      num_of_item: 1,
      product_amount: amount,
    });
    const sslResponse = await axios.post(BASE_URL, payload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (sslResponse.data.status === "SUCCESS" && sslResponse.data.GatewayPageURL) {
      return res.status(200).json({ gatewayUrl: sslResponse.data.GatewayPageURL, transactionId });
    } else {
      return res.status(500).json({ message: "SSLCommerz initiation failed", details: sslResponse.data });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/payment/success", async (req, res) => {
  try {
    const { tran_id, val_id, bank_tran_id, card_type, store_amount, status } = req.body;
    if (status !== "VALID" && status !== "VALIDATED") {
      return res.redirect(`${FRONTEND_URL}/payment/fail?reason=invalid`);
    }
    const validateRes = await axios.get(
      `${VALIDATE_URL}?val_id=${val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASS}&format=json`
    );
    const vData = validateRes.data;
    if (vData.status === "VALID" || vData.status === "VALIDATED") {
      await DonationModel.findOneAndUpdate(
        { transactionId: tran_id },
        { paymentStatus: "success", bankTransactionId: bank_tran_id, cardType: card_type, storeAmount: store_amount }
      );
      return res.redirect(`${FRONTEND_URL}/payment/success?tran_id=${tran_id}`);
    } else {
      return res.redirect(`${FRONTEND_URL}/payment/fail?reason=validation_failed`);
    }
  } catch (err) {
    console.error(err);
    res.redirect(`${FRONTEND_URL}/payment/fail?reason=server_error`);
  }
});

router.post("/payment/fail", async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) {
      await DonationModel.findOneAndUpdate({ transactionId: tran_id }, { paymentStatus: "failed" });
    }
    res.redirect(`${FRONTEND_URL}/payment/fail`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/payment/fail`);
  }
});

router.post("/payment/cancel", async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) {
      await DonationModel.findOneAndUpdate({ transactionId: tran_id }, { paymentStatus: "cancelled" });
    }
    res.redirect(`${FRONTEND_URL}/payment/cancel`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/payment/cancel`);
  }
});

router.get("/donation/status/:transactionId", async (req, res) => {
  try {
    const donation = await DonationModel.findOne({ transactionId: req.params.transactionId });
    if (!donation) return res.status(404).json({ message: "Not found" });
    res.json({ status: donation.paymentStatus, amount: donation.amount, donorName: donation.donorName, transactionId: donation.transactionId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/donate/supplies", async (req, res) => {
  try {
    const { donorName, donorEmail, donorPhone, donorAddress, supplies, dropOffDate, dropOffLocation } = req.body;
    if (!supplies || supplies.length === 0) {
      return res.status(400).json({ message: "Please add at least one supply item" });
    }
    const donation = new DonationModel({
      donorName, donorEmail, donorPhone, donorAddress,
      donationType: "supplies", supplies, dropOffDate, dropOffLocation,
      dropOffStatus: "scheduled", paymentStatus: "pending",
    });
    await donation.save();
    res.status(201).json({ message: "Supply donation scheduled!", donation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/transparency", async (req, res) => {
  try {
    const fundsResult = await DonationModel.aggregate([
      { $match: { donationType: "money", paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalFundsCollected = fundsResult[0]?.total || 0;

    const utilizedResult = await DonationModel.aggregate([
      { $match: { donationType: "money", isUtilized: true } },
      { $group: { _id: null, total: { $sum: "$utilizedAmount" } } },
    ]);
    const totalFundsUtilized = utilizedResult[0]?.total || 0;

    const distinctDonors = await DonationModel.distinct("donorEmail");
    const totalDonors = distinctDonors.length;

    const totalSupplyDonations = await DonationModel.countDocuments({ donationType: "supplies" });

    const itemsResult = await DonationModel.aggregate([
      { $match: { donationType: "supplies", dropOffStatus: "received" } },
      { $unwind: "$supplies" },
      { $group: { _id: "$supplies.item", totalQuantity: { $sum: "$supplies.quantity" } } },
    ]);

    const servedAreasResult = await DonationModel.aggregate([
      { $match: { servedArea: { $ne: "" }, isUtilized: true } },
      { $group: { _id: "$servedArea", fundsUsed: { $sum: "$utilizedAmount" }, familiesAided: { $sum: 1 } } },
      { $sort: { fundsUsed: -1 } },
    ]);

    const recentTransactions = await DonationModel.find({
      $or: [{ paymentStatus: "success" }, { donationType: "supplies" }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("donorName donationType amount supplies createdAt transactionId paymentStatus dropOffStatus");

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await DonationModel.aggregate([
      { $match: { donationType: "money", paymentStatus: "success", createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const typeBreakdown = await DonationModel.aggregate([
      { $match: { paymentStatus: "success" } },
      { $group: { _id: "$donationType", count: { $sum: 1 } } },
    ]);

    res.json({
      totalFundsCollected,
      totalFundsUtilized,
      fundsRemaining: totalFundsCollected - totalFundsUtilized,
      totalDonors,
      totalSupplyDonations,
      itemsDistributed: itemsResult,
      servedAreas: servedAreasResult,
      recentTransactions,
      monthlyTrend,
      typeBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/admin/donation/:id", async (req, res) => {
  try {
    const updated = await DonationModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
