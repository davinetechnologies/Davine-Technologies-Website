const express = require("express");

const PortalProfile = require("../models/PortalProfile");
const { verifyToken, requireIntern } = require("../middleware/auth");

const router = express.Router();

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
        profileCompleted: true,
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
      const { name, domain, currentWeek } = req.body;

      if (!name || !domain || !currentWeek) {
        return res.status(400).json({
          success: false,
          message: "Name, domain and current week are required",
        });
      }

      const existing = await PortalProfile.findOne({
        userId: req.user.id,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Portal profile already exists",
          profile: existing,
        });
      }

      const profile = await PortalProfile.create({
        userId: req.user.id,
        email: req.user.email,
        name: name.trim(),
        domain: domain.trim(),
        currentWeek: Number(currentWeek),
        profileCompleted: true,
      });

      return res.status(201).json({
        success: true,
        message: "Portal profile created successfully",
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

      if (req.body.name !== undefined) {
        updates.name = req.body.name.trim();
      }

      if (req.body.domain !== undefined) {
        updates.domain = req.body.domain.trim();
      }

      if (req.body.currentWeek !== undefined) {
        updates.currentWeek = Number(req.body.currentWeek);
      }

      if (req.body.profilePhoto !== undefined) {
        updates.profilePhoto = req.body.profilePhoto;
      }

      const profile = await PortalProfile.findOneAndUpdate(
        { userId: req.user.id },
        { $set: updates },
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