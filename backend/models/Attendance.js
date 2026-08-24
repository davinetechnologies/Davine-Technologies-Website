const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intern",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      required: true,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per intern per day
attendanceSchema.index(
  { intern: 1, date: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);