const mongoose = require("mongoose");

const internCollectionSchema = new mongoose.Schema(
  {
    accessType: {
      type: String,
      enum: ["WITH_ID_CARD", "NO_ID_CARD"],
      required: true
    },

    internId: {
      type: String,
      trim: true,
      default: ""
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    domain: {
      type: String,
      enum: ["DevOps", "Cloud", "Data Analyst", "Gen AI"],
      required: true
    },

    currentWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    upcomingWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.InternCollection ||
  mongoose.model("InternCollection", internCollectionSchema);