
const express = require("express");
const router = express.Router();

const Resource = require("../models/Resource");
const Intern = require("../models/Intern");
const { verifyToken, requireMentor } = require("../middleware/auth");

// GET /api/resources
router.get("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.type === "mentor") {
      const resources = await Resource.find().sort({ createdAt: -1 });
      return res.json(resources);
    }

    const intern = await Intern.findById(req.user.id);

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    const resources = await Resource.find({
      $and: [
        {
          $or: [
            { targetDomain: null },
            { targetDomain: { $exists: false } },
            { targetDomain: "" },
            { targetDomain: intern.domain }
          ]
        },
        {
          $or: [
            { targetWeek: null },
            { targetWeek: { $exists: false } },
            { targetWeek: intern.currentWeek }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    return res.json(resources);
  } catch (err) {
    next(err);
  }
});

// POST /api/resources
router.post("/", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const { name, url, targetDomain, targetWeek } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        message: "Resource name and URL are required"
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

    const resource = await Resource.create({
      name: name.trim(),
      url: url.trim(),
      targetDomain: targetDomain || null,
      targetWeek: week,
      createdBy: req.user.id
    });

    return res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/resources/:id
router.delete("/:id", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Resource not found"
      });
    }

    await Resource.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Resource deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
