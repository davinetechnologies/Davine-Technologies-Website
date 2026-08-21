const mongoose = require("mongoose");

const curriculumSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      trim: true,
    },

    week: {
      type: Number,
      required: true,
      min: 1,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    task: {
      type: String,
      default: "",
    },

    activity: {
      type: String,
      default: "",
    },

    upcomingWeek: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

curriculumSchema.index(
  { domain: 1, week: 1 },
  { unique: true }
);

module.exports = mongoose.model("Curriculum", curriculumSchema);