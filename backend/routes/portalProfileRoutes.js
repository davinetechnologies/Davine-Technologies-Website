const express = require("express");

const PortalProfile = require("../models/PortalProfile");
const Intern = require("../models/Intern");

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
      const intern = await Intern.findById(req.user.id).lean();

      if (!intern) {
        return res.status(404).json({
          success: false,
          message: "Intern not found",
        });
      }

      const profile = await PortalProfile.findOne({
        userId: req.user.id,
      }).lean();

      // No profile yet = first login
      if (!profile) {
        return res.json({
          success: true,
          setupRequired: true,
          profileCompleted: false,
          intern: {
            name:
              intern.name ||
              intern.fullName ||
              intern.internName ||
              "",

            email:
              intern.email ||
              req.user.email ||
              "",

            domain:
              intern.domain ||
              "",

            currentWeek:
              intern.currentWeek ||
              1,
          },
        });
      }

      // Profile exists but not completed
      if (profile.profileCompleted !== true) {
        return res.json({
          success: true,
          setupRequired: true,
          profileCompleted: false,
          intern: {
            name:
              profile.name ||
              intern.name ||
              intern.fullName ||
              "",

            email:
              profile.email ||
              intern.email ||
              req.user.email ||
              "",

            domain:
              profile.domain ||
              intern.domain ||
              "",

            currentWeek:
              profile.currentWeek ||
              intern.currentWeek ||
              1,
          },
        });
      }

      // Profile already completed
      return res.json({
        success: true,
        setupRequired: false,
        profileCompleted: true,
        intern: {
          name:
            profile.name ||
            intern.name ||
            intern.fullName ||
            "",

          email:
            profile.email ||
            intern.email ||
            req.user.email ||
            "",

          domain:
            profile.domain ||
            intern.domain ||
            "",

          currentWeek:
            profile.currentWeek ||
            intern.currentWeek ||
            1,
        },

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
        userId: req.user.id,
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
        profileCompleted: profile.profileCompleted === true,
        profile,
      });

    } catch (error) {
      next(error);
    }
  }
);


// =====================================================
// CREATE PORTAL PROFILE
// POST /api/portal-profile/setup
// =====================================================

router.post(
  "/setup",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {

      const {
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
      } = req.body;


      // ============================================
      // REQUIRED FIELDS
      // ============================================

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
      }

      if (!college) {
        return res.status(400).json({
          success: false,
          message: "College / University is required",
        });
      }

      if (!course) {
        return res.status(400).json({
          success: false,
          message: "Course / Degree is required",
        });
      }


      // ============================================
      // GET INTERN
      // ============================================

      const intern = await Intern.findById(
        req.user.id
      ).lean();

      if (!intern) {
        return res.status(404).json({
          success: false,
          message: "Intern not found",
        });
      }


      // ============================================
      // CHECK EXISTING PROFILE
      // ============================================

      const existing = await PortalProfile.findOne({
        userId: req.user.id,
      });

      if (existing) {

        return res.status(409).json({
          success: false,
          alreadyCompleted: existing.profileCompleted === true,
          message: "Portal profile already exists",
          profile: existing,
        });

      }


      // ============================================
      // CREATE PROFILE
      // ============================================

      const profile = await PortalProfile.create({

        userId: req.user.id,

        email:
          intern.email ||
          req.user.email ||
          "",

        name:
          intern.name ||
          intern.fullName ||
          intern.internName ||
          "Intern",

        domain:
          intern.domain ||
          "",

        currentWeek:
          intern.currentWeek ||
          1,

        phone:
          phone.trim(),

        dob:
          dob || "",

        gender:
          gender || "",

        address:
          address || "",

        city:
          city || "",

        state:
          state || "",

        pincode:
          pincode || "",

        college:
          college.trim(),

        course:
          course.trim(),

        graduationYear:
          graduationYear
            ? Number(graduationYear)
            : null,

        linkedin:
          linkedin || "",

        github:
          github || "",

        profileCompleted:
          true,
      });


      // ============================================
      // SUCCESS
      // ============================================

      return res.status(201).json({

        success: true,

        message:
          "Portal profile created successfully",

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

      if (req.body.name !== undefined) {
        updates.name =
          String(req.body.name).trim();
      }

      if (req.body.domain !== undefined) {
        updates.domain =
          String(req.body.domain).trim();
      }

      if (req.body.currentWeek !== undefined) {
        updates.currentWeek =
          Number(req.body.currentWeek);
      }

      if (req.body.profilePhoto !== undefined) {
        updates.profilePhoto =
          req.body.profilePhoto;
      }


      const profile =
        await PortalProfile.findOneAndUpdate(

          {
            userId: req.user.id,
          },

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

        message:
          "Portal profile updated successfully",

        profile,

      });

    } catch (error) {

      next(error);

    }
  }
);


module.exports = router;