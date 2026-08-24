const express = require("express");

const Batch = require("../models/Batch");
const Intern = require("../models/Intern");
const { verifyToken, requireMentor } = require("../middleware/auth");

const router = express.Router();

// Any authenticated account (mentor or intern) can read the batch directory.
router.get("/", verifyToken, async (_req, res, next) => {
  try {
    const batches = await Batch.find().sort({ startDate: -1 });
    res.json(batches);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/interns", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const interns = await Intern.find({ batch: req.params.id });
    res.json(interns);
  } catch (err) {
    next(err);
  }
});

router.post("/", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const { batchName, domain, startDate, endDate, status } = req.body;
    if (!batchName || !domain || !startDate) {
      return res.status(400).json({ message: "batchName, domain and startDate are required" });
    }
    const batch = await Batch.create({ batchName, domain, startDate, endDate, status });
    res.status(201).json(batch);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
