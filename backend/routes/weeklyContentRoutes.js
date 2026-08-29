const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");
const express = require("express");
const fs = require("fs");
const path = require("path");

const WeeklyContent = require("../models/WeeklyContent");
const Intern = require("../models/Intern");
const {
  verifyToken,
  requireMentor,
  requireIntern
} = require("../middleware/auth");
const {
  makeUploader,
  uploadToS3,
  getPresignedUrl
} = require("../middleware/uploadMiddleware");

const router = express.Router();

const upload = makeUploader("weekly-content");

// =====================================================
// GET CURRENT WEEKLY CONTENT FOR LOGGED-IN INTERN
// GET /api/weekly-content/current
//
// Uses:
// intern.domain
// intern.currentWeek
//
// Example:
// AWS Cloud + Week 5
// =====================================================

router.get(
  "/current",
  verifyToken,
  requireIntern,
  async (req, res, next) => {
    try {
      const intern = await Intern.findById(req.user.id);

      if (!intern) {
        return res.status(404).json({
          message: "Intern not found"
        });
      }

const domain = intern.domain.trim().toLowerCase();

const displayWeek =
  Number(intern.upcomingWeek || intern.currentWeek || 1);

const content = await WeeklyContent.findOne({
  domain,
  week: displayWeek,
  active: true
});

let pdfUrl = null;

if (content.pdfKey) {
  pdfUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: content.pdfKey,
    }),
    { expiresIn: 3600 }
  );
}

if (!content) {
  return res.status(404).json({
    message: `No weekly content has been published for ${intern.domain}, Week ${displayWeek}`,
    domain: intern.domain,
    currentWeek: displayWeek
  });
}
const responseData = content.toObject();

if (content.pdfUrl) {
  responseData.pdfUrl = await getPresignedUrl(content.pdfUrl);
}

res.json({
  ...content.toObject(),
  pdfUrl,
  currentWeek: displayWeek,
  domain: intern.domain
});

    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// GET ALL WEEKLY CONTENT
// GET /api/weekly-content
//
// Mentor:
// Can see all domains and all weeks.
//
// Optional:
// /api/weekly-content?domain=DevOps
// /api/weekly-content?domain=AWS%20Cloud
// =====================================================

router.get("/", verifyToken, async (req, res, next) => {
  try {
    const filter = {};

if (req.query.domain) {
  filter.domain = req.query.domain.trim().toLowerCase();
}

    const existing = await WeeklyContent
      .find(filter)
      .sort({ domain: 1, week: 1 });

    // Intern view
    if (req.user.type === "intern") {
      return res.json(
        existing.filter((w) => w.active)
      );
    }

    // Mentor view
    res.json(existing);

  } catch (err) {
    next(err);
  }
});


// =====================================================
// GET WEEKLY CONTENT BY DOMAIN + WEEK
//
// GET /api/weekly-content/:domain/:week
//
// Example:
// /api/weekly-content/DevOps/1
// /api/weekly-content/AWS%20Cloud/1
// =====================================================

router.get(
  "/:domain/:week",
  verifyToken,
  async (req, res, next) => {
    try {
const domain = decodeURIComponent(req.params.domain)
  .trim()
  .toLowerCase();      const week = Number(req.params.week);

      if (!week || week < 1 || week > 12) {
        return res.status(400).json({
          message: "Week must be between 1 and 12"
        });
      }

      const content = await WeeklyContent.findOne({
        domain,
        week
      });

      if (
        !content ||
        (req.user.type === "intern" && !content.active)
      ) {
        return res.status(404).json({
          message: `No content found for ${domain}, Week ${week}`
        });
      }

const responseData = content.toObject();

if (content.pdfUrl) {
  responseData.pdfUrl = await getPresignedUrl(content.pdfUrl);
}

res.json(responseData);
    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// POST /api/weekly-content
//
// Mentor creates:
// Domain + Week + Title + PDF
// =====================================================

router.post(
  "/",
  verifyToken,
  requireMentor,
  upload.single("pdf"),
  async (req, res, next) => {
    try {
const domain = req.body.domain?.trim().toLowerCase();
      const week = Number(req.body.week);
      const title = req.body.title?.trim();

      if (!domain) {
        return res.status(400).json({
          message: "domain is required"
        });
      }

      if (!week || week < 1 || week > 12) {
        return res.status(400).json({
          message: "week must be a number between 1 and 12"
        });
      }

      if (!title) {
        return res.status(400).json({
          message: "title is required"
        });
      }

      // Check duplicate ONLY inside same domain
      const existing = await WeeklyContent.findOne({
        domain,
        week
      });

      if (existing) {
        return res.status(409).json({
          message: `${domain} Week ${week} already has content. Use replace instead.`
        });
      }

let pdfData = null;

if (req.file) {
  pdfData = await uploadToS3(
    req.file,
    "weekly-content"
  );
}
const content = await WeeklyContent.create({
  domain,
  week,
  title,
pdfUrl: pdfData ? pdfData.url : null,
pdfKey: pdfData ? pdfData.key : null,
  pdfOriginalName: pdfData
    ? pdfData.originalName
    : null,
  active: true
});


      res.status(201).json(content);

    } catch (err) {
      next(err);
    }
  }
);


// =====================================================
// PUT /api/weekly-content/:domain/:week
//
// Update title / active / PDF
// =====================================================

router.put(
  "/:domain/:week",
  verifyToken,
  requireMentor,
  upload.single("pdf"),
  async (req, res, next) => {
    try {
const domain = decodeURIComponent(req.params.domain)
  .trim()
  .toLowerCase();
        const week = Number(req.params.week);

      if (!week || week < 1 || week > 12) {
        return res.status(400).json({
          message: "week must be between 1 and 12"
        });
      }

      const content = await WeeklyContent.findOne({
        domain,
        week
      });

      if (!content) {
        return res.status(404).json({
          message: `${domain} Week ${week} has no content yet`
        });
      }

      if (req.body.title !== undefined) {
        content.title = req.body.title.trim();
      }

      if (req.body.active !== undefined) {
        content.active =
          req.body.active === "true" ||
          req.body.active === true;
      }

      // Replace PDF
if (req.file) {
  const pdfData = await uploadToS3(
    req.file,
    "weekly-content"
  );

  content.pdfUrl = pdfData.key;
  content.pdfOriginalName = pdfData.originalName;
}

      await content.save();

      res.json(content);

    } catch (err) {
      next(err);
    }
  }
);


module.exports = router;