const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Intern = require("../models/Intern");
const Mentor = require("../models/Mentor");
const PortalProfile = require("../models/PortalProfile");

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
  type: "mentor",
  role: mentor.role || "mentor",
  portal: "mentor",
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

const portalPassword =
  process.env.INTERN_DEFAULT_PASSWORD || "Intern@2026";

if (password !== portalPassword) {
  return res.status(401).json({
    success: false,
    message: "Incorrect email or password",
  });
}

// Find intern by email
let intern = await Intern.findOne({
  email: cleanEmail,
});

// =================================================
// AUTO CREATE INTERN ACCOUNT
// =================================================

if (!intern) {
  intern = await Intern.create({
    internId: `INT-${Date.now()}`,
    name: "",
    email: cleanEmail,
    domain: "",
    batch: "",
    status: "Active",
    currentWeek: 1,
    upcomingWeek: 2,
    progress: 0,
  });
}

// =================================================
// FIND PORTAL PROFILE
// =================================================

let profile = await PortalProfile.findOne({
  userId: intern._id,
});

// =================================================
// FIRST LOGIN → CREATE PROFILE
// =================================================

if (!profile) {
  profile = await PortalProfile.create({
    userId: intern._id,
    email: cleanEmail,
    name: intern.name || "",
    domain: intern.domain || "",
    currentWeek: intern.currentWeek || 1,
    profileCompleted: false,
  });
}

// =================================================
// CREATE JWT
// =================================================

const token = jwt.sign(
  {
    id: intern._id,
    email: intern.email,
    type: "intern",
    role: "intern",
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
  }
);

// =================================================
// FIRST LOGIN
// =================================================

if (profile.profileCompleted !== true) {
  return res.json({
    success: true,
    message: "Login successful. Profile setup required.",
    token,
    setupRequired: true,
    user: {
      id: intern._id,
      profileId: profile._id,
      email: cleanEmail,
      name: profile.name || "",
      domain: profile.domain || "",
      currentWeek: profile.currentWeek || 1,
      type: "intern",
      role: "intern",
    },
  });
}

// =================================================
// EXISTING INTERN → DIRECT DASHBOARD
// =================================================

return res.json({
  success: true,
  message: "Login successful",
  token,
  setupRequired: false,
  user: {
    id: intern._id,
    profileId: profile._id,
    internId: intern.internId,
    name: profile.name || intern.name || "",
    email: intern.email,
    type: "intern",
    role: "intern",
    domain: profile.domain || intern.domain || "",
    currentWeek: profile.currentWeek || intern.currentWeek || 1,
    photo: profile.profilePhoto || null,
    phone: profile.phone || "",
    status: intern.status || "Active",
    progress: intern.progress || 0,
    joiningDate: intern.joiningDate || null,
    endingDate: intern.endingDate || null,
    idCardUrl: intern.idCardUrl || "",
    certificateUrl: intern.certificateUrl || "",
  },
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