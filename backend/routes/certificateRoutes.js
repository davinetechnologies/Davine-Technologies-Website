
const express = require("express");
const mongoose = require("mongoose");

const Certificate = require("../models/Certificate");
const Intern = require("../models/Intern");
const Submission = require("../models/Submission");
const { verifyToken, requireMentor, requireIntern } = require("../middleware/auth");

const router = express.Router();

// Mentor-only routes
router.post(
  "/issue",
  verifyToken,
  requireMentor,
  async (req, res, next) => {
    try {
const {
  internId,
  credentialId,
  role,
  description,
  domain
} = req.body;
      if (!internId || !credentialId || !role) {
        return res.status(400).json({
          success: false,
          message: "Intern ID, credential ID and role are required."
        });
      }

      const cleanCredentialId = String(credentialId).trim();
      const cleanRole = String(role).trim();
      
const allowedDomains = [
  "devops",
  "cloud",
  "ta",
  "web",
  "data",
  "ai",
  "cyber",
  "uiux",
  "marketing"
];

const cleanDomain = String(domain || "").trim();

if (!allowedDomains.includes(cleanDomain)) {
  return res.status(400).json({
    success: false,
    message: "Please select a valid certificate domain."
  });
}


      if (!cleanCredentialId || !cleanRole) {
        return res.status(400).json({
          success: false,
          message: "Credential ID and role cannot be empty."
        });
      }

      if (!mongoose.Types.ObjectId.isValid(internId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid intern ID."
        });
      }

      const intern = await Intern.findById(internId);

      if (!intern) {
        return res.status(404).json({
          success: false,
          message: "Intern not found."
        });
      }

      const week12 = await Submission.findOne({
        intern: intern._id,
        week: 12,
        status: "Approved"
      });

      if (!week12) {
        return res.status(403).json({
          success: false,
          message: "Certificate can only be issued after Week 12 is approved."
        });
      }

      const existingCertificate = await Certificate.findOne({
        $or: [
          { intern: intern._id },
          { credentialId: cleanCredentialId }
        ]
      });

      if (existingCertificate) {
        return res.status(409).json({
          success: false,
          message: existingCertificate.intern.toString() === intern._id.toString()
            ? "A certificate has already been issued to this intern."
            : "This credential ID is already in use."
        });
      }

      const certificate = await Certificate.create({
        intern: intern._id,
        internId: intern.internId,
        internName: intern.name,
        domain: String(domain || "").trim(),        
        role: cleanRole,
        description: String(description || "").trim(),
        credentialId: cleanCredentialId,
        issuedAt: new Date(),
        issuedBy: req.user.id,
        week12Submission: week12._id,
        status: "Issued"
      });

      res.status(201).json({
        success: true,
        message: "Certificate issued and saved successfully.",
        certificate
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A certificate or credential ID already exists."
        });
      }

      next(err);
    }
  }
);

// Intern can retrieve only their own issued certificate
router.get(
  "/me",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
      const certificate = await Certificate.findOne({
        intern: req.user.id,
        status: "Issued"
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          issued: false,
          message: "Your certificate has not been issued yet."
        });
      }

      res.json({
        success: true,
        issued: true,
        certificate
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
