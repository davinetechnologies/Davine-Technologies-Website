const mongoose = require("mongoose");

const internSchema = new mongoose.Schema(
  {
    internId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    domain: {
      type: String,
      required: true,
      trim: true
    },

    batch: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Active", "Completed", "Inactive", "Suspended"],
      default: "Active"
    },

    currentWeek: {
      type: Number,
      default: 1,
      min: 1
    },

    upcomingWeek: {
  type: Number,
  default: 2,
  min: 1,
  max: 12
},

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    joiningDate: {
      type: Date,
      default: null
    },

    endingDate: {
      type: Date,
      default: null
    },

    profilePhoto: {
      type: String,
      default: ""
    },

    idCardUrl: {
      type: String,
      default: ""
    },

    certificateUrl: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Intern ||
  mongoose.model("Intern", internSchema, "interncollections");