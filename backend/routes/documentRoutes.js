const express = require("express");

const Document = require("../models/Document");
const Intern = require("../models/Intern");
const { verifyToken, requireMentor } = require("../middleware/auth");
const { makeUploader, toPublicUrl } = require("../middleware/uploadMiddleware");

const router = express.Router();
const upload = makeUploader("documents");

// GET /api/documents - interns only see the list if their access.documents flag is on.
router.get("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.type === "intern") {
      const intern = await Intern.findById(req.user.id);
      if (!intern || !intern.access.documents) return res.json([]);
    }
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

router.post("/", verifyToken, requireMentor, upload.single("file"), async (req, res, next) => {
  try {
    const { title, category } = req.body;
    if (!title || !req.file) {
      return res.status(400).json({ message: "title and a PDF file are required" });
    }
    const doc = await Document.create({
      title,
      category: category || "Other",
      fileUrl: toPublicUrl("documents", req.file.filename),
      originalName: req.file.originalname,
      uploadedBy: req.user.id,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", verifyToken, requireMentor, async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json({ message: "Document deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
