const mongoose = require("mongoose");

/**
 * A request from one warehouse to another to move stock.
 *
 * Lifecycle:
 *   pending -> approved -> in-transit -> received
 *      |          |
 *      |          +-> cancelled  (stock is returned to the source)
 *      +-> rejected
 *
 * Stock only moves at two points:
 *   approve -> quantity LEAVES the source warehouse
 *   receive -> quantity LANDS at the destination warehouse
 * In between it belongs to neither warehouse (it is on the truck).
 */
const TransferRequestSchema = new mongoose.Schema(
  {
    // The warehouse that holds the stock and is being asked to give it up.
    fromWarehouse: { type: String, required: true, trim: true },

    // The warehouse facing the shortage.
    toWarehouse: { type: String, required: true, trim: true },

    // The source warehouse's inventory row, plus a denormalised name so the
    // request still reads correctly if that row is later deleted.
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },

    quantity: { type: Number, required: true, min: 1 },

    reason: { type: String, trim: true, maxlength: 500 },
    responseNote: { type: String, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "in-transit",
        "received",
        "rejected",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    neededBy: { type: Date }, // requester: when they need it
    eta: { type: Date },      // source: estimated arrival, set on dispatch

    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }, // approved or rejected
    dispatchedAt: { type: Date },
    receivedAt: { type: Date },

    requestedBy: { type: String, trim: true },
    respondedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

// A warehouse cannot transfer to itself.
//
// Written with no `next` argument on purpose: Mongoose 9 runs document
// middleware promise-style, so a hook declared as `function (next)` receives
// nothing and blows up with "next is not a function" the moment it runs.
// A zero-argument hook that throws works on every version.
TransferRequestSchema.pre("validate", function () {
  if (this.fromWarehouse === this.toWarehouse) {
    throw new Error("Source and destination warehouse must be different");
  }
});

// Fast lookups for the incoming / outgoing tables.
TransferRequestSchema.index({ fromWarehouse: 1, status: 1, requestedAt: -1 });
TransferRequestSchema.index({ toWarehouse: 1, status: 1, requestedAt: -1 });

module.exports = mongoose.model("TransferRequest", TransferRequestSchema);
