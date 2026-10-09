
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intern",
      required: true,
      unique: true,
      index: true
    },

    internId: {
      type: String,
      required: true,
      trim: true
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

    role: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    credentialId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    issuedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    week12Submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },

    status: {
      type: String,
      enum: ["Issued", "Revoked"],
      default: "Issued"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", certificateSchema);
