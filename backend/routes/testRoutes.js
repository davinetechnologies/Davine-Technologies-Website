const express = require("express");
const router = express.Router();

const {
    generateTestIdCard
} = require("../controllers/testController");

router.post("/id-card", generateTestIdCard);

module.exports = router;