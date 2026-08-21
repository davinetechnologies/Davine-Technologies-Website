const express = require("express");

const router = express.Router();

const {
  submitIntern,
  getAllInterns,
  updateWeek,
  syncOnboardings
} = require("../controllers/internCollection.controller");


// Save intern data
router.post("/submit", submitIntern);


// Get all intern data
router.get("/interns", getAllInterns);


// Update existing intern weekly data
router.put("/update-week", updateWeek);


// Sync existing onboarding records → InternCollection
router.post("/sync-onboardings", syncOnboardings);


module.exports = router;