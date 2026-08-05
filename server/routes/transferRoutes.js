const express = require("express");
const router = express.Router();

const Inventory = require("../model/Inventory");
const TransferRequest = require("../model/TransferRequest");

/* Same cutoff the Inventory UI uses for the "Low" pill. */
const LOW_STOCK_THRESHOLD = 100;

/**
 * Mirrors getStatus() in client/src/Components/Inventory.jsx.
 * Inventory.status is denormalised, so any time we change a quantity we have
 * to recompute it or the table will show a stale pill.
 */
function computeStatus(qty, expiry) {
  const today = new Date();
  if (qty < LOW_STOCK_THRESHOLD) return "Low";
  if (expiry) {
    const exp = new Date(expiry);
    if (exp < today) return "Expired";
    if ((exp - today) / (1000 * 60 * 60 * 24) < 7) return "Expiring";
  }
  return "OK";
}

/**
 * Item names are typed by hand in the Add Item form, so "Blood o+" and
 * "Blood O+" are the same relief supply sitting in two warehouses. Compare
 * them loosely or the shortage view reports "nothing available" while the
 * stock is right there under a slightly different capitalisation.
 */
function sameItem(a, b) {
  return (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
}

async function refreshStatus(doc) {
  if (!doc) return doc;
  doc.status = computeStatus(doc.quantity ?? 0, doc.expiryDate);
  await doc.save();
  return doc;
}

/* Which statuses each action may be applied to. */
const ALLOWED_FROM = {
  approve: ["pending"],
  reject: ["pending"],
  cancel: ["pending", "approved"],
  dispatch: ["approved"],
  receive: ["approved", "in-transit"],
};

function assertTransition(transfer, action, res) {
  if (!ALLOWED_FROM[action].includes(transfer.status)) {
    res.status(409).json({
      error: `Cannot ${action} a transfer that is "${transfer.status}"`,
    });
    return false;
  }
  return true;
}

/* ────────────────────────────────────────────────────────────────
 * GET /api/transfers/shortages?warehouse=Warehouse%20A
 * Items at or below the low-stock cutoff, each with a list of other
 * warehouses that actually hold spare stock of the same item.
 * Drives the shortage banner and prefills the request form.
 * ──────────────────────────────────────────────────────────────── */
router.get("/transfers/shortages", async (req, res) => {
  try {
    const { warehouse } = req.query;
    const all = await Inventory.find().lean();

    const short = all.filter(
      (it) =>
        (warehouse ? it.warehouseLocation === warehouse : true) &&
        (it.quantity ?? 0) < LOW_STOCK_THRESHOLD
    );

    const result = short.map((it) => ({
      _id: it._id,
      itemName: it.itemName,
      category: it.category,
      quantity: it.quantity ?? 0,
      threshold: LOW_STOCK_THRESHOLD,
      warehouseLocation: it.warehouseLocation,
      // Any OTHER warehouse holding a matching item with stock on the shelf.
      // Deliberately not filtered by the low-stock cutoff: a warehouse sitting
      // on 90 units can still spare 30, and refusing to show it just makes the
      // request button look broken. Whether the source can afford to give the
      // stock up is the source admin's call at approval time, not ours here.
      availableFrom: all
        .filter(
          (o) =>
            sameItem(o.itemName, it.itemName) &&
            o.warehouseLocation &&
            o.warehouseLocation !== it.warehouseLocation &&
            (o.quantity ?? 0) > 0
        )
        .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
        .map((o) => ({
          itemId: o._id,
          warehouseLocation: o.warehouseLocation,
          quantity: o.quantity,
        })),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
 * POST /api/transfers
 * The short warehouse asks another warehouse for stock.
 * body: { itemId, quantity, toWarehouse, reason, neededBy, requestedBy }
 * fromWarehouse is derived from the item row, so it can never disagree
 * with where the stock actually sits.
 * ──────────────────────────────────────────────────────────────── */
router.post("/transfers", async (req, res) => {
  try {
    const { itemId, quantity, toWarehouse, reason, neededBy, requestedBy } =
      req.body;

    const qty = Number(quantity);
    if (!itemId || !toWarehouse || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        error:
          "itemId, toWarehouse and a positive whole-number quantity are required",
      });
    }

    const source = await Inventory.findById(itemId);
    if (!source) return res.status(404).json({ error: "Item not found" });

    if (!source.warehouseLocation) {
      return res
        .status(400)
        .json({ error: "That item has no warehouse location set" });
    }
    if (source.warehouseLocation === toWarehouse) {
      return res
        .status(400)
        .json({ error: "Source and destination warehouse must be different" });
    }
    if ((source.quantity ?? 0) < qty) {
      return res.status(400).json({
        error: `${source.warehouseLocation} only has ${
          source.quantity ?? 0
        } unit(s) of ${source.itemName}`,
      });
    }

    const transfer = await TransferRequest.create({
      fromWarehouse: source.warehouseLocation,
      toWarehouse,
      item: source._id,
      itemName: source.itemName,
      category: source.category,
      quantity: qty,
      reason,
      neededBy: neededBy || undefined,
      requestedBy,
    });

    res.status(201).json(transfer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
 * GET /api/transfers?warehouse=Warehouse%20A&dir=in|out&status=pending
 *   dir=in  -> requests this warehouse must approve (it is the source)
 *   dir=out -> requests this warehouse has made   (it is the destination)
 *   no dir  -> both
 * ──────────────────────────────────────────────────────────────── */
router.get("/transfers", async (req, res) => {
  try {
    const { warehouse, dir, status } = req.query;
    const filter = {};

    if (warehouse) {
      if (dir === "in") filter.fromWarehouse = warehouse;
      else if (dir === "out") filter.toWarehouse = warehouse;
      else
        filter.$or = [
          { fromWarehouse: warehouse },
          { toWarehouse: warehouse },
        ];
    }
    if (status) filter.status = status;

    const transfers = await TransferRequest.find(filter).sort({
      requestedAt: -1,
    });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
 * PATCH /api/transfers/:id/approve
 * Stock LEAVES the source warehouse here.
 *
 * The conditional update is the important part: the `$gte` guard means two
 * admins approving at the same moment can never drive stock negative. The
 * second one matches nothing and gets a 409 instead of silently overselling.
 * ──────────────────────────────────────────────────────────────── */
router.patch("/transfers/:id/approve", async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });
    if (!assertTransition(transfer, "approve", res)) return;

    const source = await Inventory.findOneAndUpdate(
      { _id: transfer.item, quantity: { $gte: transfer.quantity } },
      { $inc: { quantity: -transfer.quantity } },
      { new: true }
    );

    if (!source) {
      return res.status(409).json({
        error:
          "Not enough stock left at the source warehouse to approve this transfer",
      });
    }

    await refreshStatus(source);

    transfer.status = "approved";
    transfer.respondedAt = new Date();
    transfer.respondedBy = req.body.respondedBy;
    transfer.responseNote = req.body.responseNote;
    await transfer.save();

    res.json({ transfer, sourceItem: source });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PATCH /api/transfers/:id/reject — no stock moves */
router.patch("/transfers/:id/reject", async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });
    if (!assertTransition(transfer, "reject", res)) return;

    transfer.status = "rejected";
    transfer.respondedAt = new Date();
    transfer.respondedBy = req.body.respondedBy;
    transfer.responseNote = req.body.responseNote;
    await transfer.save();

    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PATCH /api/transfers/:id/dispatch — marks it on the road, records the ETA */
router.patch("/transfers/:id/dispatch", async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });
    if (!assertTransition(transfer, "dispatch", res)) return;

    transfer.status = "in-transit";
    transfer.dispatchedAt = new Date();
    if (req.body.eta) transfer.eta = req.body.eta;
    await transfer.save();

    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
 * PATCH /api/transfers/:id/receive
 * Stock LANDS at the destination. Upsert, because the destination often
 * has no row for this item at all — which is frequently why it is short.
 * ──────────────────────────────────────────────────────────────── */
router.patch("/transfers/:id/receive", async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });
    if (!assertTransition(transfer, "receive", res)) return;

    const sourceItem = await Inventory.findById(transfer.item).lean();

    const destItem = await Inventory.findOneAndUpdate(
      { itemName: transfer.itemName, warehouseLocation: transfer.toWarehouse },
      {
        $inc: { quantity: transfer.quantity },
        $setOnInsert: {
          itemName: transfer.itemName,
          warehouseLocation: transfer.toWarehouse,
          category: transfer.category || sourceItem?.category,
          expiryDate: sourceItem?.expiryDate,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await refreshStatus(destItem);

    transfer.status = "received";
    transfer.receivedAt = new Date();
    await transfer.save();

    res.json({ transfer, destinationItem: destItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
 * PATCH /api/transfers/:id/cancel
 * If it was already approved the stock was deducted — put it back.
 * ──────────────────────────────────────────────────────────────── */
router.patch("/transfers/:id/cancel", async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });
    if (!assertTransition(transfer, "cancel", res)) return;

    if (transfer.status === "approved") {
      const restored = await Inventory.findByIdAndUpdate(
        transfer.item,
        { $inc: { quantity: transfer.quantity } },
        { new: true }
      );
      await refreshStatus(restored);
    }

    transfer.status = "cancelled";
    transfer.responseNote = req.body.responseNote;
    await transfer.save();

    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
