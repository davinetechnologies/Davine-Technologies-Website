
const express = require("express");

const Announcement = require("../models/Announcement");
const Intern = require("../models/Intern");
const Batch = require("../models/Batch");
const {
  verifyToken,
  requireMentor
} = require("../middleware/auth");

const router = express.Router();

function normalizeDomain(domain) {
  const value = String(domain || "").trim().toLowerCase();

  const aliases = {
    "aws": "aws cloud",
    "cloud": "aws cloud",
    "aws/cloud": "aws cloud",
    "aws / cloud": "aws cloud",
    "aws cloud": "aws cloud"
  };

  return aliases[value] || value;
}

// GET /api/announcements
router.get("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.type === "mentor") {
      const announcements = await Announcement.find()
        .populate("targetBatch", "batchName")
        .sort({ publishedAt: -1 });

      return res.json(announcements);
    }

    const intern = await Intern.findById(req.user.id);

    if (!intern) {
      return res.status(404).json({
        message: "Intern not found"
      });
    }

    if (intern.access?.announcements === false) {
      return res.json([]);
    }

    const batch = intern.batch
      ? await Batch.findOne({
          batchName: intern.batch
        }).select("_id")
      : null;

    const internDomain = normalizeDomain(intern.domain);

    const allAnnouncements = await Announcement.find()
      .populate("targetBatch", "batchName")
      .sort({ publishedAt: -1 });

    const announcements = allAnnouncements.filter((announcement) => {
      const targetDomain = normalizeDomain(announcement.targetDomain);
      const targetWeek = announcement.targetWeek;
      const targetBatchId =
        announcement.targetBatch?._id?.toString() ||
        announcement.targetBatch?.toString() ||
        null;

      const internBatchId = batch?._id?.toString() || null;

      const domainMatches =
        !targetDomain || targetDomain === internDomain;

      const weekMatches =
        targetWeek == null ||
        Number(targetWeek) === Number(intern.currentWeek);

      const batchMatches =
        !targetBatchId ||
        (internBatchId && targetBatchId === internBatchId);

      return domainMatches && weekMatches && batchMatches;
    });

    return res.json(announcements);
  } catch (err) {
    next(err);
  }
});

// POST /api/announcements
router.post("/", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const {
      title,
      message,
      targetBatch,
      targetDomain,
      targetWeek,
      publishedAt
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        message: "Title and message are required"
      });
    }

    const week =
      targetWeek === "" || targetWeek == null
        ? null
        : Number(targetWeek);

    if (
      week !== null &&
      (!Number.isInteger(week) || week < 1 || week > 12)
    ) {
      return res.status(400).json({
        message: "Target week must be between 1 and 12"
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      targetBatch: targetBatch || null,
      targetDomain:
        typeof targetDomain === "string" && targetDomain.trim()
          ? targetDomain.trim()
          : null,
      targetWeek: week,
      publishedAt: publishedAt || Date.now(),
      createdBy: req.user.id
    });

    return res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/announcements/:id
router.delete(
  "/:id",
  verifyToken,
  requireMentor,
  async (req, res, next) => {
    try {
      const announcement = await Announcement.findById(
        req.params.id
      );

      if (!announcement) {
        return res.status(404).json({
          message: "Announcement not found"
        });
      }

      await Announcement.findByIdAndDelete(req.params.id);

      return res.json({
        message: "Announcement deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
