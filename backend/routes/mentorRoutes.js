const express = require("express");
const bcrypt = require("bcryptjs");

const Mentor = require("../models/Mentor");
const { verifyToken, requireMentor } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken, requireMentor);

// GET /api/mentors/me
router.get("/me", async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.user.id).select("-passwordHash");
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });
    res.json(mentor);
  } catch (err) {
    next(err);
  }
});

// POST /api/mentors - lets an existing mentor onboard a co-mentor account.
router.post("/", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const mentor = await Mentor.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role === "admin" ? "admin" : "mentor",
    });
    const { passwordHash: _omit, ...safe } = mentor.toObject();
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
