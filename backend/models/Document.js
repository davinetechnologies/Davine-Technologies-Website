const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    originalName: { type: String, default: null },
    category: {
      type: String,
      enum: ["Guidelines", "Resource", "Policy", "Other"],
      default: "Other",
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
