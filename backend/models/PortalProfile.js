const mongoose = require("mongoose");

const portalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      trim: true,
    },

    currentWeek: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    profileCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PortalProfile ||
  mongoose.model("PortalProfile", portalProfileSchema);