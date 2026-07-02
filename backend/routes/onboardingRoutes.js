const express = require("express");
const router = express.Router();

const {
  createOnboarding,
  getAllOnboardings,
} = require("../controllers/onboardingController");

router.post("/", createOnboarding);

router.get("/", getAllOnboardings);

module.exports = router;