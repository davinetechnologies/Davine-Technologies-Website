const mongoose = require("mongoose");

const weeklyProgressSchema = new mongoose.Schema(
  {
    // Existing interncollections record
    internCollectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternCollection",
      required: true,
      index: true
    },

    // Keep email as a stable identifier
    internEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    internName: {
      type: String,
      required: true,
      trim: true
    },

    domain: {
      type: String,
      required: true,
      trim: true
    },

    // Weekly number
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    // -----------------------------
    // TASK
    // -----------------------------
    task: {
      title: {
        type: String,
        default: ""
      },

      description: {
        type: String,
        default: ""
      },

      submissionUrl: {
        type: String,
        default: ""
      },

      status: {
        type: String,
        enum: ["Pending", "Submitted", "Reviewed"],
        default: "Pending"
      }
    },

    // -----------------------------
    // ACTIVITY
    // -----------------------------
    activity: {
      title: {
        type: String,
        default: ""
      },

      description: {
        type: String,
        default: ""
      },

      submissionUrl: {
        type: String,
        default: ""
      },

      status: {
        type: String,
        enum: ["Pending", "Submitted", "Reviewed"],
        default: "Pending"
      }
    },

    // -----------------------------
    // AI ASSISTANT TASK
    // -----------------------------
    aiAssistantTask: {
      title: {
        type: String,
        default: ""
      },

      submissionUrl: {
        type: String,
        default: ""
      },

      status: {
        type: String,
        enum: ["Pending", "Submitted", "Reviewed"],
        default: "Pending"
      }
    },

    // -----------------------------
    // OVERALL WEEK STATUS
    // -----------------------------
    overallStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending"
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    remarks: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);


// One intern = one record for one week
weeklyProgressSchema.index(
  {
    internCollectionId: 1,
    week: 1
  },
  {
    unique: true
  }
);


module.exports =
  mongoose.models.WeeklyProgress ||
  mongoose.model("WeeklyProgress", weeklyProgressSchema);