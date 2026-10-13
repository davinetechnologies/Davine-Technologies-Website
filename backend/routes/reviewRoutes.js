const express = require("express");
const router = express.Router();
const Certificate = require("../models/Certificate");

const {
  verifyToken,
  requireIntern,
  requireMentor,
} = require("../middleware/auth");

const Intern = require("../models/Intern");
const Review = require("../models/Review");

// INTERN: Submit or update review
router.post("/", verifyToken, requireIntern, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const intern = await Intern.findById(userId);

    if (!intern) {
      return res.status(404).json({
        message: "Intern account not found",
      });
    }

    const rating = Number(req.body.rating);
    const reviewText = String(req.body.review || "").trim();
    const title = String(req.body.title || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    if (reviewText.length < 10 || reviewText.length > 2000) {
      return res.status(400).json({
        message: "Review must contain 10 to 2000 characters",
      });
    }

const existingReview = await Review.findOne({
  intern: intern._id,
});

if (existingReview) {
  return res.status(409).json({
    success: false,
    message: "You have already submitted your review. Only one review is allowed per intern.",
    reviewSubmitted: true,
    certificateUnlocked: true,
  });
}
    const savedReview = await Review.findOneAndUpdate(
      { intern: intern._id },
      {
        $set: {
          internId: intern.internId,
          name: intern.name,
          domain: intern.domain,
          batch: intern.batch || "",
          rating,
          title,
          review: reviewText,
          certificateUnlocked: true,
        },
        $setOnInsert: {
          status: "Pending",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

return res.status(201).json({
  message: "Review submitted successfully. Your review is pending moderation.",
  reviewSubmitted: true,
  review: {
    rating: savedReview.rating,
    status: savedReview.status,
  },
});
  } catch (error) {
    console.error("Review submission error:", error);
    return res.status(500).json({
      message: "Unable to submit review",
    });
  }
});

// INTERN: Check review status
router.get("/my", verifyToken, requireIntern, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const review = await Review.findOne({
      intern: userId,
    }).select("rating title review status certificateUnlocked createdAt");

    return res.json({
      reviewSubmitted: Boolean(review),
      certificateUnlocked: Boolean(
        review && review.certificateUnlocked
      ),
      review,
    });
  } catch (error) {
    console.error("Review status error:", error);
    return res.status(500).json({
      message: "Unable to check review status",
    });
  }
});

// MENTOR / ADMIN: List reviews for moderation
router.get("/admin", verifyToken, requireMentor, async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ reviews });
  } catch (error) {
    console.error("Review moderation list error:", error);
    return res.status(500).json({
      message: "Unable to load reviews",
    });
  }
});

// MENTOR / ADMIN: Approve or reject public display
router.patch(
  "/admin/:id/status",
  verifyToken,
  requireMentor,
  async (req, res) => {
    try {
      const { status } = req.body;

if (!["Approved", "Rejected", "Unpublished"].includes(status)) {
            return res.status(400).json({
          message: "Status must be Approved or Rejected",
        });
      }

      const review = await Review.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status,
            moderatedBy: req.user.id || req.user._id,
            moderatedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!review) {
        return res.status(404).json({
          message: "Review not found",
        });
      }

      return res.json({
        message: "Review moderation status updated",
        review,
      });
    } catch (error) {
      console.error("Review moderation error:", error);
      return res.status(500).json({
        message: "Unable to update review status",
      });
    }
  }
);

// PUBLIC: Only approved reviews are visible
router.get("/public", async (req, res) => {
  try {
    const reviews = await Review.find({
      status: "Approved",
    })
      .select("name domain batch rating title review createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ reviews });
  } catch (error) {
    console.error("Public reviews error:", error);
    return res.status(500).json({
      message: "Unable to load public reviews",
    });
  }
});

module.exports = router;
