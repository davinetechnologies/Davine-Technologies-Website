const express = require("express");
const router = express.Router();

const Resource = require("../models/Resource");
const { verifyToken, requireMentor } = require("../middleware/auth");


router.get("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.type === "mentor") {
      const resources = await Resource.find().sort({ createdAt: -1 });
      return res.json(resources);
    }

    const Intern = require("../models/Intern");
    const intern = await Intern.findById(req.user.id);

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    const resources = await Resource.find({
      $and: [
        {
          $or: [
            { targetDomain: null },
            { targetDomain: "" },
            { targetDomain: intern.domain }
          ]
        },
        {
          $or: [
            { targetWeek: null },
            { targetWeek: intern.currentWeek }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    next(err);
  }
});


// POST /api/resources
// Mentors can add resources


router.get("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.type === "mentor") {
      const resources = await Resource.find().sort({ createdAt: -1 });
      return res.json(resources);
    }

    const Intern = require("../models/Intern");
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


// DELETE /api/resources/:id
// Mentors can delete resources
router.delete("/:id", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Resource not found"
      });
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.json({
      message: "Resource deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;