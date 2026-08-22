const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const WeeklyProgress = require("../models/WeeklyProgress");

const InternCollection = mongoose.connection.collection("interncollections");

// =====================================================
// GET WEEKLY PROGRESS BY INTERN ID
// GET /api/weekly-progress/:internId
// =====================================================

router.get("/:internId", async (req, res) => {
  try {
    const internId = req.params.internId.trim();

    const intern = await InternCollection.findOne({
      internId: internId
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }

    const records = await WeeklyProgress.find({
      internCollectionId: intern._id
    }).sort({ week: 1 });

    res.json({
      success: true,

      intern: {
        id: intern._id,
        internId: intern.internId,
        name: intern.fullName,
        email: intern.email,
        domain: intern.domain,
        currentWeek: intern.currentWeek,
        upcomingWeek: intern.upcomingWeek
      },

      count: records.length,
      weeklyProgress: records
    });

  } catch (error) {
    console.error("Create weekly progress error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create weekly progress",
      error: error.message,
      name: error.name
    });
  }
});
// =====================================================
// GET WEEKLY PROGRESS BY EMAIL
// GET /api/weekly-progress/email/:email
// =====================================================

router.get("/email/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const intern = await InternCollection.findOne({
      email
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }

    const records = await WeeklyProgress.find({
      internCollectionId: intern._id
    }).sort({ week: 1 });

    res.json({
      success: true,

      intern: {
        id: intern._id,
        name: intern.fullName,
        email: intern.email,
        domain: intern.domain,
        currentWeek: intern.currentWeek,
        upcomingWeek: intern.upcomingWeek
      },

      count: records.length,
      weeklyProgress: records
    });

  } catch (error) {
    console.error("Get weekly progress error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get weekly progress"
    });
  }
});


// =====================================================
// CREATE WEEKLY PROGRESS
// POST /api/weekly-progress
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      email,
      week,
      task,
      activity,
      aiAssistantTask
    } = req.body;

    if (!email || !week) {
      return res.status(400).json({
        success: false,
        message: "Email and week are required"
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const weekNumber = Number(week);


    // ---------------------------------------------
    // Find existing intern
    // ---------------------------------------------

    const intern = await InternCollection.findOne({
      email: cleanEmail
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found in interncollections"
      });
    }


    // ---------------------------------------------
    // Check duplicate weekly record
    // ---------------------------------------------

    const existing = await WeeklyProgress.findOne({
      internCollectionId: intern._id,
      week: weekNumber
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Weekly progress already exists for this intern and week",
        weeklyProgress: existing
      });
    }


    // ---------------------------------------------
    // Create weekly record
    // ---------------------------------------------

    const weeklyProgress = await WeeklyProgress.create({

      internCollectionId: intern._id,

      internEmail: intern.email,

      internName: intern.fullName,

      domain: intern.domain,

      week: weekNumber,

      task: task || {},

      activity: activity || {},

      aiAssistantTask: aiAssistantTask || {}

    });


    res.status(201).json({
      success: true,
      message: "Weekly progress created successfully",
      weeklyProgress
    });

} catch (error) {

  console.error("CREATE WEEKLY PROGRESS ERROR:", error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Weekly progress already exists",
      error: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: "Failed to create weekly progress",
    error: error.message,
    name: error.name,
    details: error.errors || null
  });
}
});


// =====================================================
// UPDATE WEEKLY PROGRESS
// PUT /api/weekly-progress/:email/:week
// =====================================================

router.put("/:email/:week", async (req, res) => {
  try {

    const email = req.params.email.toLowerCase().trim();

    const week = Number(req.params.week);


    const intern = await InternCollection.findOne({
      email
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }


    const weeklyProgress = await WeeklyProgress.findOne({
      internCollectionId: intern._id,
      week
    });


    if (!weeklyProgress) {
      return res.status(404).json({
        success: false,
        message: "Weekly progress not found"
      });
    }


    const {
      task,
      activity,
      aiAssistantTask,
      overallStatus,
      progress,
      remarks
    } = req.body;


    if (task !== undefined) {
      weeklyProgress.task = {
        ...weeklyProgress.task,
        ...task
      };
    }


    if (activity !== undefined) {
      weeklyProgress.activity = {
        ...weeklyProgress.activity,
        ...activity
      };
    }


    if (aiAssistantTask !== undefined) {
      weeklyProgress.aiAssistantTask = {
        ...weeklyProgress.aiAssistantTask,
        ...aiAssistantTask
      };
    }


    if (overallStatus !== undefined) {
      weeklyProgress.overallStatus = overallStatus;
    }


    if (progress !== undefined) {
      weeklyProgress.progress = Number(progress);
    }


    if (remarks !== undefined) {
      weeklyProgress.remarks = remarks;
    }


    await weeklyProgress.save();


    res.json({
      success: true,
      message: "Weekly progress updated successfully",
      weeklyProgress
    });
    
} catch (error) {

  console.error("UPDATE WEEKLY PROGRESS ERROR:", error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Weekly progress already exists",
      error: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: "Failed to update weekly progress",
    error: error.message,
    name: error.name,
    details: error.errors || null
  });
}
});


module.exports = router;