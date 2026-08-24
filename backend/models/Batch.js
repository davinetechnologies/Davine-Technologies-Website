const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchName: { type: String, required: true, trim: true, unique: true },
    domain: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Upcoming", "Active", "Completed"],
      default: "Upcoming",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", batchSchema);
