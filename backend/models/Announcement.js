const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    targetBatch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    targetDomain: { type: String, default: null, trim: true },
    targetWeek: {
  type: Number,
  default: null,
  min: 1,
  max: 12,
},
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
