const express = require("express");
const router = express.Router();
const InventoryModel = require("../model/Inventory");

// GET full analytics dashboard data
router.get("/admin/storage-analytics", async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const allItems = await InventoryModel.find();

    // Total stock by category
    const categoryBreakdown = allItems.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = { count: 0, totalQuantity: 0 };
      acc[cat].count += 1;
      acc[cat].totalQuantity += item.quantity || 0;
      return acc;
    }, {});

    // Expiry alerts
    const expiredItems = allItems.filter(
      (i) => i.expiryDate && new Date(i.expiryDate) < now
    );
    const expiringIn7Days = allItems.filter(
      (i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= in7Days
    );
    const expiringIn30Days = allItems.filter(
      (i) => i.expiryDate && new Date(i.expiryDate) > in7Days && new Date(i.expiryDate) <= in30Days
    );

    // Stock status breakdown
    const statusBreakdown = allItems.reduce((acc, item) => {
      const s = item.status || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    // Low stock items (quantity < 10)
    const lowStockItems = allItems.filter((i) => (i.quantity || 0) < 10);

    // Warehouse breakdown
    const warehouseBreakdown = allItems.reduce((acc, item) => {
      const w = item.warehouseLocation || "Unknown";
      if (!acc[w]) acc[w] = { count: 0, totalQuantity: 0 };
      acc[w].count += 1;
      acc[w].totalQuantity += item.quantity || 0;
      return acc;
    }, {});

    res.json({
      totalItems: allItems.length,
      totalQuantity: allItems.reduce((s, i) => s + (i.quantity || 0), 0),
      categoryBreakdown,
      statusBreakdown,
      warehouseBreakdown,
      expiredItems,
      expiringIn7Days,
      expiringIn30Days,
      lowStockItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;