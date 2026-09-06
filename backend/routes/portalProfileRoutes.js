const express = require("express");
const Intern = require("../models/Intern");
const PortalProfile = require("../models/PortalProfile");

const {
  verifyToken,
  requireIntern,
} = require("../middleware/auth");

const router = express.Router();


// =====================================================
// GET FIRST-TIME SETUP INFORMATION
// GET /api/portal-profile/setup-info
// =====================================================

router.get(
  "/setup-info",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
const profile = await PortalProfile.findOne({
  userId: req.user.id
}).lean();

      if (!profile) {
        return res.json({
          success: true,
          setupRequired: true,
          profileCompleted: false,
        });
      }

      return res.json({
        success: true,
        setupRequired: profile.profileCompleted !== true,
        profileCompleted: profile.profileCompleted === true,
        profile,
      });

    } catch (error) {
      next(error);
    }
  }
);


// =====================================================
// GET MY PORTAL PROFILE
// GET /api/portal-profile/me
// =====================================================

router.get(
  "/me",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
const profile = await PortalProfile.findOne({
  userId: req.user.id
});

      if (!profile) {
        return res.status(404).json({
          success: false,
          profileCompleted: false,
          message: "Portal profile not created yet",
        });
      }

      return res.json({
        success: true,
        profileCompleted:
          profile.profileCompleted === true,
        profile,
      });

    } catch (error) {
      next(error);
    }
  }
);


// =====================================================
// COMPLETE FIRST LOGIN PROFILE
// POST /api/portal-profile/setup
// =====================================================

// =====================================================
// COMPLETE FIRST LOGIN PROFILE
// POST /api/portal-profile/setup
// =====================================================

router.post(
  "/setup",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        address,
        city,
        state,
        pincode,
        college,
        course,
        graduationYear,
        linkedin,
        github,
        domain,
        currentWeek,
      } = req.body;

      // ============================================
      // REQUIRED FIELDS
      // ============================================

      if (!name || !String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      if (!email || !String(email).trim()) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      if (!phone || !String(phone).trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
      }

      if (!domain || !String(domain).trim()) {
        return res.status(400).json({
          success: false,
          message: "Domain is required",
        });
      }

      if (!currentWeek) {
        return res.status(400).json({
          success: false,
          message: "Current week is required",
        });
      }

      if (!college || !String(college).trim()) {
        return res.status(400).json({
          success: false,
          message: "College / University is required",
        });
      }

      if (!course || !String(course).trim()) {
        return res.status(400).json({
          success: false,
          message: "Course / Degree is required",
        });
      }

      // ============================================
      // VALIDATE CURRENT WEEK
      // ============================================

      const week = Number(currentWeek);

      if (!Number.isInteger(week) || week < 1 || week > 12) {
        return res.status(400).json({
          success: false,
          message: "Current week must be between 1 and 12",
        });
      }

      // ============================================
      // FIND LOGGED-IN PORTAL PROFILE
      // ============================================

let profile = await PortalProfile.findOne({
  userId: req.user.id
});

if (!profile) {
  const intern = await Intern.findById(req.user.id);

  if (!intern) {
    return res.status(404).json({
      success: false,
      message: "Intern not found"
    });
  }

  profile = await PortalProfile.create({
    userId: intern._id,
    email: intern.email,
    name: intern.name || "",
    domain: intern.domain || "",
    currentWeek: intern.currentWeek || 1,
    profileCompleted: false
  });
}

      // ============================================
      // PREVENT SECOND FIRST-LOGIN SUBMISSION
      // ============================================

      if (profile.profileCompleted === true) {
        return res.status(409).json({
          success: false,
          alreadyCompleted: true,
          message: "Profile setup is already completed",
        });
      }

      // ============================================
      // CHECK EMAIL DUPLICATE
      // ============================================

      const cleanEmail =
        String(email).trim().toLowerCase();

      const existingProfile =
        await PortalProfile.findOne({
          email: cleanEmail,
          _id: { $ne: profile._id },
        });

      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message:
            "This email is already associated with another portal profile.",
        });
      }

      // ============================================
      // SAVE FIRST LOGIN DATA
      // ============================================

      profile.name =
        String(name).trim();

      profile.email =
        cleanEmail;

      profile.domain =
        String(domain).trim();

      profile.currentWeek =
        week;

      profile.phone =
        String(phone).trim();

      profile.dob =
        dob ? String(dob).trim() : "";

      profile.gender =
        gender ? String(gender).trim() : "";

      profile.address =
        address ? String(address).trim() : "";

      profile.city =
        city ? String(city).trim() : "";

      profile.state =
        state ? String(state).trim() : "";

      profile.pincode =
        pincode ? String(pincode).trim() : "";

      profile.college =
        String(college).trim();

      profile.course =
        String(course).trim();

      profile.graduationYear =
        graduationYear
          ? Number(graduationYear)
          : null;

      profile.linkedin =
        linkedin ? String(linkedin).trim() : "";

      profile.github =
        github ? String(github).trim() : "";

      // ============================================
      // MARK PROFILE COMPLETED
      // ============================================

      profile.profileCompleted = true;

      // =====================================================
// SYNC INTERN DATA
// =====================================================

const intern = await Intern.findById(req.user.id);

if (intern) {
  intern.name = profile.name;
  intern.email = profile.email;
  intern.domain = profile.domain;
  intern.currentWeek = profile.currentWeek;

  await intern.save();
}

      await profile.save();

      // ============================================
      // SUCCESS
      // ============================================

      return res.status(200).json({
        success: true,
        message: "Profile setup completed successfully",
        profile,
      });

    } catch (error) {
      console.error(
        "Portal profile setup error:",
        error
      );

      // MongoDB duplicate key
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "This email is already associated with another portal profile.",
        });
      }

      next(error);
    }
  }
);

module.exports = router;