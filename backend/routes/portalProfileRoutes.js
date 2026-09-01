const express = require("express");

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
      const profile = await PortalProfile.findById(
        req.user.id
      ).lean();

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
      const profile = await PortalProfile.findById(
        req.user.id
      );

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
      } = req.body;


      // ============================================
      // REQUIRED FIELDS
      // ============================================

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
      }

      if (!domain || !domain.trim()) {
        return res.status(400).json({
          success: false,
          message: "Domain is required",
        });
      }

      if (!college || !college.trim()) {
        return res.status(400).json({
          success: false,
          message: "College / University is required",
        });
      }

      if (!course || !course.trim()) {
        return res.status(400).json({
          success: false,
          message: "Course / Degree is required",
        });
      }


      // ============================================
      // FIND LOGGED-IN PORTAL PROFILE
      // ============================================

      const profile =
        await PortalProfile.findById(req.user.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Portal account not found",
        });
      }


      // ============================================
      // PREVENT RE-SUBMISSION OF FIRST SETUP
      // ============================================

      if (profile.profileCompleted === true) {
        return res.status(409).json({
          success: false,
          alreadyCompleted: true,
          message: "Profile setup is already completed",
        });
      }


      // ============================================
      // SAVE FIRST LOGIN DATA
      // ============================================

      profile.name = name.trim();
      profile.email = email.trim().toLowerCase();
      profile.domain = domain.trim();

      profile.phone = phone.trim();
      profile.dob = dob || "";
      profile.gender = gender || "";
      profile.address = address || "";
      profile.city = city || "";
      profile.state = state || "";
      profile.pincode = pincode || "";

      profile.college = college.trim();
      profile.course = course.trim();

      profile.graduationYear =
        graduationYear
          ? Number(graduationYear)
          : null;

      profile.linkedin = linkedin || "";
      profile.github = github || "";

      profile.profileCompleted = true;

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
      next(error);
    }
  }
);


// =====================================================
// UPDATE MY PORTAL PROFILE
// PUT /api/portal-profile/me
// =====================================================

router.put(
  "/me",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {

      const updates = {};


      if (req.body.phone !== undefined) {
        updates.phone =
          String(req.body.phone).trim();
      }

      if (req.body.dob !== undefined) {
        updates.dob =
          String(req.body.dob).trim();
      }

      if (req.body.gender !== undefined) {
        updates.gender =
          String(req.body.gender).trim();
      }

      if (req.body.address !== undefined) {
        updates.address =
          String(req.body.address).trim();
      }

      if (req.body.city !== undefined) {
        updates.city =
          String(req.body.city).trim();
      }

      if (req.body.state !== undefined) {
        updates.state =
          String(req.body.state).trim();
      }

      if (req.body.pincode !== undefined) {
        updates.pincode =
          String(req.body.pincode).trim();
      }

      if (req.body.college !== undefined) {
        updates.college =
          String(req.body.college).trim();
      }

      if (req.body.course !== undefined) {
        updates.course =
          String(req.body.course).trim();
      }

      if (req.body.graduationYear !== undefined) {
        updates.graduationYear =
          req.body.graduationYear
            ? Number(req.body.graduationYear)
            : null;
      }

      if (req.body.linkedin !== undefined) {
        updates.linkedin =
          String(req.body.linkedin).trim();
      }

      if (req.body.github !== undefined) {
        updates.github =
          String(req.body.github).trim();
      }


      const profile =
        await PortalProfile.findByIdAndUpdate(
          req.user.id,
          {
            $set: updates,
          },
          {
            new: true,
            runValidators: true,
          }
        );


      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Portal profile not found",
        });
      }


      return res.json({
        success: true,
        message: "Portal profile updated successfully",
        profile,
      });

    } catch (error) {
      next(error);
    }
  }
);


module.exports = router;