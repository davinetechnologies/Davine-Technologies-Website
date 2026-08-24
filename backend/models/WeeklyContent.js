const mongoose = require("mongoose");

const weeklyContentSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      trim: true
    },

    week: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    pdfUrl: {
      type: String,
      default: null
    },

    pdfOriginalName: {
      type: String,
      default: null
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Same week can exist in different domains.
// But same domain + same week must be unique.
weeklyContentSchema.index(
  { domain: 1, week: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.WeeklyContent ||
  mongoose.model(
    "WeeklyContent",
    weeklyContentSchema
  );