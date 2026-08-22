const express = require("express");
const Intern = require("../models/Intern");

const router = express.Router();

// =====================================================
// INTERN LOGIN
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const intern = await Intern.findOne({
      email: cleanEmail
    });

    if (!intern) {
      return res.status(401).json({
        success: false,
        message: "No intern account found with this email"
      });
    }

    // Temporary portal password
    // Later we can move to individual encrypted passwords.
    const portalPassword =
      process.env.INTERN_DEFAULT_PASSWORD || "Intern@2026";

    if (password !== portalPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password"
      });
    }

    // Only return fields required by frontend
    const internData = {
      id: intern._id,
      internId: intern.internId || "",
      name: intern.fullName || intern.name || "",
      email: intern.email,
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
      certificateUrl: intern.certificateUrl || ""
    };

    return res.json({
      success: true,
      message: "Login successful",
      intern: internData
    });

  } catch (error) {
    console.error("Intern login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed"
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
    message: "Logged out successfully"
  });
});


module.exports = router;