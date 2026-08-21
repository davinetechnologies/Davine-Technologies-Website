const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    accessType: {
      type: String,
      enum: ["ID_CARD", "NO_ID_CARD"],
      required: true,
    },

    internId: {
      type: String,
      default: "",
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      trim: true,
    },

    currentWeek: {
      type: Number,
      required: true,
      min: 1,
    },

    upcomingWeek: {
      type: Number,
      required: true,
      min: 1,
    },

    taskStatus: {
      type: String,
      default: "Pending",
    },

    activityStatus: {
      type: String,
      default: "Pending",
    },

    submissionDetails: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);