const mongoose = require("mongoose");

const OperationRouteSchema = new mongoose.Schema(
  {
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operation",
      required: true,
      unique: true, // one route per operation
    },
    operationName: { type: String },
    savedBy: { type: String }, // email of volunteer who last saved
    routePoints: [
      {
        name: { type: String },
        lat: { type: Number },
        lon: { type: Number },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("OperationRoute", OperationRouteSchema);
