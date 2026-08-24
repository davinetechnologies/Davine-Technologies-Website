const express = require("express");

const Submission = require("../models/Submission");
const Intern = require("../models/Intern");
const WeeklyProgress = require("../models/WeeklyProgress");
const { verifyToken, requireMentor, requireIntern } = require("../middleware/auth");
const { makeUploader, toPublicUrl } =
  require("../middleware/uploadMiddleware");
const router = express.Router();
const upload = makeUploader("submissions");

// GET /api/submissions/me - the logged-in intern's own submission history.
router.get("/me", verifyToken, requireIntern, async (req, res, next) => {
  try {
    const submissions = await Submission.find({ intern: req.user.id }).sort({ week: 1 });
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

// POST /api/submissions - intern uploads their completed PDF for the current week.
// Upserts on (intern, week) so a rejected week can be resubmitted in place.
router.post("/", verifyToken, requireIntern, upload.single("pdf"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A PDF file is required" });

    const intern = await Intern.findById(req.user.id);
    if (!intern) return res.status(404).json({ message: "Intern not found" });

    const week = Number(req.body.week) || intern.currentWeek;
    if (week !== intern.currentWeek) {
      return res.status(400).json({
        message: `You can only submit for your current week (Week ${intern.currentWeek})`,
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { intern: intern._id, week },
      {
        submissionFile: toPublicUrl("submissions", req.file.filename),
        submissionOriginalName: req.file.originalname,
        status: "Submitted",
        submittedAt: new Date(),
        // Resetting the review state means it goes back into the mentor's queue.
        reviewedAt: null,
        reviewedBy: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await WeeklyProgress.findOneAndUpdate(
      { intern: intern._id, week },
      { status: "In Progress" },
      { upsert: true }
    );

    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
});

// Everything below is mentor-only.
router.use(verifyToken, requireMentor);

// GET /api/submissions/board?week=&domain=&batch=&status=&search=
// Combines existing submissions with interns who haven't submitted yet for
// that week, so the mentor sees a complete picture (matches the spec's
// Intern | Week | Submission | Status | Action table, Pending rows included).
router.get("/board", async (req, res, next) => {
  try {
    const { week, domain, batch, status, search } = req.query;
    if (!week) {
      return res.status(400).json({ message: "week is required for the board view" });
    }
    const weekNum = Number(week);

    const internFilter = { status: "Active" };
    if (domain) internFilter.domain = domain;
    if (batch) internFilter.batch = batch;
    if (search) {
      const re = new RegExp(search.trim(), "i");
      internFilter.$or = [{ name: re }, { email: re }, { internId: re }];
    }

    const interns = await Intern.find(internFilter).populate("batch", "batchName");
    const submissions = await Submission.find({ week: weekNum, intern: { $in: interns.map((i) => i._id) } });
    const byIntern = new Map(submissions.map((s) => [s.intern.toString(), s]));

    let board = interns.map((intern) => {
      const sub = byIntern.get(intern._id.toString());
      return {
        intern: {
          _id: intern._id,
          name: intern.name,
          internId: intern.internId,
          email: intern.email,
          domain: intern.domain,
          batch: intern.batch,
        },
        week: weekNum,
        submission: sub || null,
        status: sub ? sub.status : "Pending",
      };
    });

    if (status) {
      board = board.filter((row) => row.status === status);
    }

    res.json(board);
  } catch (err) {
    next(err);
  }
});

// GET /api/submissions?week=&status=&search=  - flat history view across all weeks
router.get("/", async (req, res, next) => {
  try {
    const { week, status, search } = req.query;
    const filter = {};
    if (week) filter.week = Number(week);
    if (status) filter.status = status;

    let query = Submission.find(filter).populate("intern", "name email internId domain batch").sort({ submittedAt: -1 });
    let submissions = await query;

    if (search) {
      const re = new RegExp(search.trim(), "i");
      submissions = submissions.filter(
        (s) => s.intern && (re.test(s.intern.name) || re.test(s.intern.email) || re.test(s.intern.internId))
      );
    }

    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

// GET /api/submissions/:id
router.get("/:id", async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      "intern",
      "name email internId domain batch"
    );
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    res.json(submission);
  } catch (err) {
    next(err);
  }
});

// PUT /api/submissions/:id/review - Approve or Reject with optional feedback.
router.put("/:id/review", async (req, res, next) => {
  try {
    const { status, mentorFeedback } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be 'Approved' or 'Rejected'" });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        status,
        mentorFeedback: mentorFeedback || null,
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      },
      { new: true }
    );
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    await WeeklyProgress.findOneAndUpdate(
      { intern: submission.intern, week: submission.week },
      { status: status === "Approved" ? "Completed" : "In Progress" },
      { upsert: true }
    );

    res.json(submission);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
