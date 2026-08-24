const express = require("express");

const Announcement = require("../models/Announcement");
const Intern = require("../models/Intern");
const { verifyToken, requireMentor } = require("../middleware/auth");

const router = express.Router();

// GET /api/announcements - mentors see everything; interns see only
// announcements targeted at their batch/domain (or untargeted/general ones),
// and only if their access.announcements flag is on.
router.get("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.type === "mentor") {
      const announcements = await Announcement.find().populate("targetBatch", "batchName").sort({ publishedAt: -1 });
      return res.json(announcements);
    }

    const intern = await Intern.findById(req.user.id);
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    if (!intern.access.announcements) return res.json([]);

    const announcements = await Announcement.find({
      $or: [
        { targetBatch: null, targetDomain: null },
        { targetBatch: intern.batch },
        { targetDomain: intern.domain },
      ],
    })
      .populate("targetBatch", "batchName")
      .sort({ publishedAt: -1 });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

router.post("/", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const { title, message, targetBatch, targetDomain, publishedAt } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "title and message are required" });
    }
    const announcement = await Announcement.create({
      title,
      message,
      targetBatch: targetBatch || null,
      targetDomain: targetDomain || null,
      publishedAt: publishedAt || Date.now(),
      createdBy: req.user.id,
    });
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
