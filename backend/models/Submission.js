const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    // ================= INTERN PORTAL =================

    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intern",
      default: null,
    },

    week: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },

    submissionFile: {
      type: String,
      default: null,
    },

    submissionOriginalName: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["Pending", "Submitted", "Approved", "Rejected"],
      default: "Pending",
    },

    mentorFeedback: {
      type: String,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      default: null,
    },

    // ================= DAVINE EXISTING =================

    accessType: {
      type: String,
      enum: ["ID_CARD", "NO_ID_CARD"],
      default: "NO_ID_CARD",
    },

    internId: {
      type: String,
      default: "",
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
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
      default: "",
      trim: true,
    },

    currentWeek: {
      type: Number,
      min: 1,
      default: null,
    },

    upcomingWeek: {
      type: Number,
      min: 1,
      default: null,
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

// One submission per intern per week
submissionSchema.index(
  { intern: 1, week: 1 },
  { unique: true, sparse: true }
);

module.exports =
  mongoose.models.Submission ||
  mongoose.model("Submission", submissionSchema);