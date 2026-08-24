const express = require("express");

const Attendance = require("../models/Attendance");
const {
  verifyToken,
  requireMentor,
  requireIntern
} = require("../middleware/auth");

const router = express.Router();


// =====================================================
// POST /api/attendance/login
// Automatically mark intern Present when they log in
// =====================================================

router.post(
  "/login",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
      const internId = req.user.id;

      // Start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // One attendance record per intern per day
      const record = await Attendance.findOneAndUpdate(
        {
          intern: internId,
          date: today
        },
        {
          $setOnInsert: {
            intern: internId,
            date: today,
            status: "Present",
            markedBy: null
          }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      res.status(200).json({
        success: true,
        message: "Attendance marked successfully",
        attendance: record
      });

    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// GET /api/attendance/me
// Intern's own attendance history
// =====================================================

router.get(
  "/me",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
      const records = await Attendance.find({
        intern: req.user.id
      }).sort({
        date: -1
      });

      res.json(records);

    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// GET /api/attendance
// Mentor attendance view
// Supports:
// ?intern=
// ?from=
// ?to=
// =====================================================

router.get(
  "/",
  verifyToken,
  requireMentor,
  async (req, res, next) => {
    try {
      const {
        intern,
        from,
        to
      } = req.query;

      const filter = {};

      if (intern) {
        filter.intern = intern;
      }

      if (from || to) {
        filter.date = {};

        if (from) {
          const fromDate = new Date(from);
          fromDate.setHours(0, 0, 0, 0);

          filter.date.$gte = fromDate;
        }

        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);

          filter.date.$lte = toDate;
        }
      }

      const records = await Attendance.find(filter)
        .populate(
          "intern",
          "fullName name internId email domain"
        )
        .sort({
          date: -1
        });

      res.json(records);

    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// POST /api/attendance
// Mentor manually marks attendance
// =====================================================

router.post(
  "/",
  verifyToken,
  requireMentor,
  async (req, res, next) => {
    try {
      const {
        intern,
        date,
        status
      } = req.body;

      if (
        !intern ||
        !date ||
        !["Present", "Absent", "Leave"].includes(status)
      ) {
        return res.status(400).json({
          message:
            "intern, date and a valid status are required"
        });
      }

      // Normalize date to start of day
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const record = await Attendance.findOneAndUpdate(
        {
          intern,
          date: attendanceDate
        },
        {
          status,
          markedBy: req.user.id
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      res.status(201).json(record);

    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// PUT /api/attendance/:id
// Mentor edits existing attendance
// =====================================================

router.put(
  "/:id",
  verifyToken,
  requireMentor,
  async (req, res, next) => {
    try {
      const {
        status
      } = req.body;

      if (
        !["Present", "Absent", "Leave"].includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid attendance status"
        });
      }

      const record =
        await Attendance.findByIdAndUpdate(
          req.params.id,
          {
            status,
            markedBy: req.user.id
          },
          {
            new: true
          }
        );

      if (!record) {
        return res.status(404).json({
          message: "Attendance record not found"
        });
      }

      res.json({
        success: true,
        message: "Attendance updated successfully",
        attendance: record
      });

    } catch (err) {
      next(err);
    }
  }
);


module.exports = router;