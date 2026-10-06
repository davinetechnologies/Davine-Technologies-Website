const express = require("express");
const router = express.Router();

const Resource = require("../models/Resource");
const { verifyToken, requireMentor } = require("../middleware/auth");

// GET /api/resources
// Mentors and interns can view resources
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const resources = await Resource.find()
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    next(err);
  }
});

// POST /api/resources
// Mentors can add resources
router.post("/", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        message: "Resource name and URL are required"
      });
    }

    const resource = await Resource.create({
      name: name.trim(),
      url: url.trim(),
      createdBy: req.user.id
    });

    res.status(201).json(resource);
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