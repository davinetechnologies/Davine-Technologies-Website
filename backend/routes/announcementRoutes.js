const express = require("express");

const Announcement = require("../models/Announcement");
const Intern = require("../models/Intern");
const Batch = require("../models/Batch");
const { verifyToken, requireMentor } = require("../middleware/auth");

const router = express.Router();

// GET /api/announcements - mentors see everything; interns see only
// announcements targeted at their batch/domain (or untargeted/general ones),
// and only if their access.announcements flag is on.

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
      return res.status(404).json({ message: "Intern not found" });
    }

    if (intern.access?.announcements === false) {
      return res.json([]);
    }

    const batch = intern.batch
      ? await Batch.findOne({ batchName: intern.batch }).select("_id")
      : null;

    const audienceFilters = [
      {
        targetBatch: null,
        targetDomain: null,
        targetWeek: null
      },
      {
        targetDomain: intern.domain,
        targetWeek: intern.currentWeek
      },
      {
        targetDomain: intern.domain,
        targetWeek: null
      },
      {
        targetDomain: null,
        targetWeek: intern.currentWeek
      }
    ];

    if (batch) {
      audienceFilters.push(
        {
          targetBatch: batch._id,
          targetWeek: intern.currentWeek
        },
        {
          targetBatch: batch._id,
          targetWeek: null
        }
      );
    }

    const announcements = await Announcement.find({
      $or: audienceFilters
    })
      .populate("targetBatch", "batchName")
      .sort({ publishedAt: -1 });

    res.json(announcements);
  } catch (err) {
    next(err);
  }
});



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
      return res.status(404).json({ message: "Intern not found" });
    }

    if (intern.access?.announcements === false) {
      return res.json([]);
    }

    const batch = intern.batch
      ? await Batch.findOne({ batchName: intern.batch }).select("_id")
      : null;

    const audienceFilters = [];

    // General announcement: no batch, domain, or week restriction
    audienceFilters.push({
      targetBatch: null,
      targetDomain: null,
      targetWeek: null
    });

    // Domain-targeted, with optional week restriction
    if (intern.domain) {
      audienceFilters.push(
        {
          targetDomain: intern.domain,
          targetWeek: intern.currentWeek,
          targetBatch: null
        },
        {
          targetDomain: intern.domain,
          targetWeek: null,
          targetBatch: null
        }
      );
    }

    // Week-targeted, without batch/domain restriction
    audienceFilters.push({
      targetBatch: null,
      targetDomain: null,
      targetWeek: intern.currentWeek
    });

    // Batch-targeted, with optional domain/week restrictions
    if (batch) {
      audienceFilters.push(
        {
          targetBatch: batch._id,
          targetDomain: null,
          targetWeek: null
        },
        {
          targetBatch: batch._id,
          targetDomain: null,
          targetWeek: intern.currentWeek
        }
      );

      if (intern.domain) {
        audienceFilters.push(
          {
            targetBatch: batch._id,
            targetDomain: intern.domain,
            targetWeek: null
          },
          {
            targetBatch: batch._id,
            targetDomain: intern.domain,
            targetWeek: intern.currentWeek
          }
        );
      }
    }

    const announcements = await Announcement.find({
      $or: audienceFilters
    })
      .populate("targetBatch", "batchName")
      .sort({ publishedAt: -1 });

    return res.json(announcements);
  } catch (err) {
    next(err);
  }
});


// DELETE /api/announcements/:id - mentors can delete announcements
router.delete("/:id", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      message: "Announcement deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
