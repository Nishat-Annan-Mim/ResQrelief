const mongoose = require("mongoose");

const CollabPostSchema = new mongoose.Schema(
  {
    postedBy: {
      agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "ngoagency" },
      agencyName: { type: String, required: true },
      agencyType: { type: String, required: true },
      district: { type: String, default: "" },
    },

    postType: {
      type: String,
      enum: ["Resource Offer", "Resource Request", "Coordination Update", "Joint Plan", "Situation Report"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    resourceTags: {
      type: [String],
      default: [],
    },

    targetDistricts: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },

    responses: [
      {
        respondedByAgency: String,
        respondedByType: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("collabpost", CollabPostSchema);