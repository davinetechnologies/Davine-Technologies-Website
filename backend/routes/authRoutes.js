const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Intern = require("../models/Intern");
const Mentor = require("../models/Mentor");

const router = express.Router();

// =====================================================
// LOGIN
// POST /api/auth/login
// Supports both mentor and intern login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // =================================================
    // MENTOR LOGIN
    // =================================================

    if (portal === "mentor") {
      const mentor = await Mentor.findOne({
        email: cleanEmail,
      }).select("+passwordHash");

      if (!mentor) {
        return res.status(401).json({
          success: false,
          message: "No mentor account found with this email",
        });
      }

      const validPassword = await bcrypt.compare(
        password,
        mentor.passwordHash
      );

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: "Incorrect email or password",
        });
      }

      const user = {
        id: mentor._id,
        name: mentor.name || "Mentor",
        email: mentor.email,
        type: mentor.role || "mentor",
        role: mentor.role || "mentor",
      };

      const token = jwt.sign(
        {
          id: mentor._id,
          type: "mentor",
          role: mentor.role || "mentor",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.json({
        success: true,
        message: "Mentor login successful",
        token,
        user,
      });
    }

    // =================================================
    // INTERN LOGIN
    // =================================================

    const intern = await Intern.findOne({
      email: cleanEmail,
    });

    if (!intern) {
      return res.status(401).json({
        success: false,
        message: "No intern account found with this email",
      });
    }

    const portalPassword =
      process.env.INTERN_DEFAULT_PASSWORD || "Intern@2026";

    if (password !== portalPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    const user = {
      id: intern._id,
      internId: intern.internId || "",
      name: intern.fullName || intern.name || "",
      email: intern.email,
      type: "intern",
      role: intern.role || `${intern.domain || "Intern"} Intern`,
      domain: intern.domain || "",
      batch: intern.batch || "",
      phone: intern.phone || "",
      photo: intern.profilePhoto || null,
      status: intern.status || "Active",
      currentWeek: intern.currentWeek || 1,
      upcomingWeek: intern.upcomingWeek || 2,
      progress: intern.progress || 0,
      joiningDate: intern.joiningDate || "",
      endingDate: intern.endingDate || "",
      idCardUrl: intern.idCardUrl || "",
      certificateUrl: intern.certificateUrl || "",
    };

    const token = jwt.sign(
      {
        id: intern._id,
        type: "intern",
        role: intern.role || "intern",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      message: "Intern login successful",
      token,
      user,
      intern: user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// =====================================================
// LOGOUT
// POST /api/auth/logout
// =====================================================

router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;