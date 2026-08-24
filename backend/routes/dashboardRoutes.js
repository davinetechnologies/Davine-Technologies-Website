const express = require("express");

const Intern = require("../models/Intern");
const Submission = require("../models/Submission");
const { verifyToken, requireMentor } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", verifyToken, requireMentor, async (_req, res, next) => {
  try {
    const [totalInterns, activeInterns, completedInterns, submissionCounts, weekBreakdown, recentSubmissions] =
      await Promise.all([
        Intern.countDocuments(),
        Intern.countDocuments({ status: "Active" }),
        Intern.countDocuments({ status: "Completed" }),
        Submission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Intern.aggregate([
          { $match: { status: "Active" } },
          { $group: { _id: "$currentWeek", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Submission.find().sort({ submittedAt: -1 }).limit(5).populate("intern", "name internId"),
      ]);

    const statusMap = { Pending: 0, Submitted: 0, Approved: 0, Rejected: 0 };
    submissionCounts.forEach((row) => {
      if (row._id) statusMap[row._id] = row.count;
    });

    res.json({
      totalInterns,
      activeInterns,
      completedInterns,
      submissions: statusMap,
      weekBreakdown: weekBreakdown.map((row) => ({ week: row._id, interns: row.count })),
      recentSubmissions,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
