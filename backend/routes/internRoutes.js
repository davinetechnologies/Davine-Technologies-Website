const express = require("express");
const Intern = require("../models/Intern");

const router = express.Router();

// =====================================================
// GET ALL INTERNS
// GET /api/interns
// =====================================================

router.get("/", async (req, res) => {
  try {
    const { domain, status, batch, currentWeek } = req.query;

    const filter = {};

    if (domain) filter.domain = domain;
    if (status) filter.status = status;
    if (batch) filter.batch = batch;
    if (currentWeek) filter.currentWeek = Number(currentWeek);

    const interns = await Intern.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: interns.length,
      interns
    });

  } catch (error) {
    console.error("Get interns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get interns"
    });
  }
});


// =====================================================
// GET SINGLE INTERN
// GET /api/interns/:internId
// =====================================================

router.get("/:internId", async (req, res) => {
  try {
    const intern = await Intern.findOne({
      internId: req.params.internId
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }

    res.json({
      success: true,
      intern
    });

  } catch (error) {
    console.error("Get intern error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get intern"
    });
  }
});


// =====================================================
// CREATE NEW INTERN
// POST /api/interns
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      internId,
      name,
      email,
      domain,
      batch,
      status,
      currentWeek,
      upcomingWeek,
      progress,
      joiningDate,
      endingDate,
      profilePhoto,
      idCardUrl,
      certificateUrl
    } = req.body;

    if (!internId || !name || !email || !domain) {
      return res.status(400).json({
        success: false,
        message: "Intern ID, name, email and domain are required"
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanInternId = internId.trim();

    const existingIntern = await Intern.findOne({
      internId: cleanInternId
    });

    if (existingIntern) {
      return res.status(409).json({
        success: false,
        message: "Intern with this ID already exists",
        intern: existingIntern
      });
    }

    const existingEmail = await Intern.findOne({
      email: cleanEmail
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Intern with this email already exists",
        intern: existingEmail
      });
    }

    const current = Number(currentWeek) || 1;

    const intern = await Intern.create({
      internId: cleanInternId,
      name: name.trim(),
      email: cleanEmail,
      domain: domain.trim(),
      batch: batch || "",
      status: status || "Active",
      currentWeek: current,
      upcomingWeek:
        upcomingWeek !== undefined
          ? Number(upcomingWeek)
          : Math.min(current + 1, 12),
      progress:
        progress !== undefined
          ? Number(progress)
          : 0,
      joiningDate: joiningDate || null,
      endingDate: endingDate || null,
      profilePhoto: profilePhoto || "",
      idCardUrl: idCardUrl || "",
      certificateUrl: certificateUrl || ""
    });

    res.status(201).json({
      success: true,
      message: "Intern created successfully",
      intern
    });

  } catch (error) {
    console.error("Create intern error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Intern ID or email already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create intern"
    });
  }
});


// =====================================================
// UPDATE INTERN
// PUT /api/interns/:internId
// =====================================================

router.put("/:internId", async (req, res) => {
  try {
    const existingIntern = await Intern.findOne({
      internId: req.params.internId
    });

    if (!existingIntern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }

    const {
      internId,
      name,
      email,
      domain,
      batch,
      status,
      currentWeek,
      upcomingWeek,
      progress,
      joiningDate,
      endingDate,
      profilePhoto,
      idCardUrl,
      certificateUrl
    } = req.body;

    if (internId && internId !== existingIntern.internId) {
      const duplicateId = await Intern.findOne({
        internId: internId.trim(),
        _id: { $ne: existingIntern._id }
      });

      if (duplicateId) {
        return res.status(409).json({
          success: false,
          message: "Another intern already has this Intern ID"
        });
      }
    }

    if (email && email.toLowerCase().trim() !== existingIntern.email) {
      const duplicateEmail = await Intern.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: existingIntern._id }
      });

      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          message: "Another intern already has this email"
        });
      }
    }

    if (internId !== undefined) existingIntern.internId = internId.trim();
    if (name !== undefined) existingIntern.name = name.trim();
    if (email !== undefined) existingIntern.email = email.toLowerCase().trim();
    if (domain !== undefined) existingIntern.domain = domain.trim();
    if (batch !== undefined) existingIntern.batch = batch;
    if (status !== undefined) existingIntern.status = status;
    if (currentWeek !== undefined) existingIntern.currentWeek = Number(currentWeek);
    if (upcomingWeek !== undefined) existingIntern.upcomingWeek = Number(upcomingWeek);
    if (progress !== undefined) existingIntern.progress = Number(progress);
    if (joiningDate !== undefined) existingIntern.joiningDate = joiningDate || null;
    if (endingDate !== undefined) existingIntern.endingDate = endingDate || null;
    if (profilePhoto !== undefined) existingIntern.profilePhoto = profilePhoto;
    if (idCardUrl !== undefined) existingIntern.idCardUrl = idCardUrl;
    if (certificateUrl !== undefined) existingIntern.certificateUrl = certificateUrl;

    await existingIntern.save();

    res.json({
      success: true,
      message: "Intern updated successfully",
      intern: existingIntern
    });

  } catch (error) {
    console.error("Update intern error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Intern ID or email already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update intern"
    });
  }
});


// =====================================================
// DELETE INTERN
// DELETE /api/interns/:internId
// =====================================================

router.delete("/:internId", async (req, res) => {
  try {
    const deletedIntern = await Intern.findOneAndDelete({
      internId: req.params.internId
    });

    if (!deletedIntern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }

    res.json({
      success: true,
      message: "Intern deleted successfully",
      internId: deletedIntern.internId
    });

  } catch (error) {
    console.error("Delete intern error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete intern"
    });
  }
});


module.exports = router;