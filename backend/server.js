const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// SECURITY
// =====================================================

app.use(helmet());
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please try again later.",
});

app.use(limiter);

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5502",
  "http://localhost:5502",

  "https://davinetechnologies.com",
  "https://www.davinetechnologies.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Divine frontend
app.use(express.static(path.join(__dirname, "..")));

// Uploads
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(
  "/uploads",
  express.static(uploadsPath)
);

// =====================================================
// DATABASE
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // =================================================
    // WEEKLY CONTENT INDEX MIGRATION
    // =================================================

    try {
      const WeeklyContent = require("./models/WeeklyContent");

      const indexes = await WeeklyContent.collection.indexes();

      const oldIndex = indexes.find(
        (index) =>
          index.name === "week_1" &&
          index.key &&
          index.key.week === 1 &&
          !index.key.domain
      );

      if (oldIndex) {
        await WeeklyContent.collection.dropIndex(
          oldIndex.name
        );

        console.log(
          "Old WeeklyContent index removed:",
          oldIndex.name
        );
      }

      await WeeklyContent.collection.createIndex(
        {
          domain: 1,
          week: 1,
        },
        {
          unique: true,
          name: "domain_1_week_1",
        }
      );

      console.log(
        "WeeklyContent domain + week index ready"
      );

    } catch (indexError) {
      if (indexError.code === 85) {
        console.log(
          "WeeklyContent domain + week index already exists"
        );
      } else {
        console.error(
          "WeeklyContent index migration error:",
          indexError.message
        );
      }
    }

  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });

// =====================================================
// EXISTING DIVINE ROUTES
// =====================================================

const applicationRoutes =
  require("./routes/applicationRoutes");

const contactRoutes =
  require("./routes/contactRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const onboardingRoutes =
  require("./routes/onboardingRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const testRoutes =
  require("./routes/testRoutes");

const internCollectionRoutes =
  require("./routes/internCollection.routes");

// =====================================================
// INTERN PORTAL ROUTES
// =====================================================

const authRoutes =
  require("./routes/authRoutes");

const internRoutes =
  require("./routes/internRoutes");

const weeklyProgressRoutes =
  require("./routes/weeklyProgressRoutes");

const mentorRoutes =
  require("./routes/mentorRoutes");

const weeklyContentRoutes =
  require("./routes/weeklyContentRoutes");

const submissionRoutes =
  require("./routes/submissionRoutes");

const announcementRoutes =
  require("./routes/announcementRoutes");

const attendanceRoutes =
  require("./routes/attendanceRoutes");

const batchRoutes =
  require("./routes/batchRoutes");

const documentRoutes =
  require("./routes/documentRoutes");

const dashboardRoutes =
  require("./routes/dashboardRoutes");

const portalProfileRoutes =
  require("./routes/portalProfileRoutes");

// =====================================================
// EXISTING DIVINE API ROUTES
// =====================================================

app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/contact",
  contactRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/onboarding",
  onboardingRoutes
);

app.use(
  "/api/payment",
  paymentRoutes
);

app.use(
  "/api/test",
  testRoutes
);

app.use(
  "/api/intern-collection",
  internCollectionRoutes
);

// =====================================================
// INTERN PORTAL API ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/interns",
  internRoutes
);

app.use(
  "/api/weekly-progress",
  weeklyProgressRoutes
);

app.use(
  "/api/mentor",
  mentorRoutes
);

app.use(
  "/api/weekly-content",
  weeklyContentRoutes
);

app.use(
  "/api/submissions",
  submissionRoutes
);

app.use(
  "/api/announcements",
  announcementRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  "/api/batches",
  batchRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/portal-profile",
  portalProfileRoutes
);
// =====================================================
// TEST INTERN MODEL
// =====================================================

const Intern = require("./models/Intern");

app.get(
  "/api/test/intern-model",
  async (req, res) => {
    try {
      const count = await Intern.countDocuments();

      res.json({
        success: true,
        message: "Intern model is working",
        internCount: count,
      });

    } catch (error) {
      console.error(
        "Intern model test failed:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Intern model test failed",
      });
    }
  }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Davine Technologies Backend is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error(
    "SERVER ERROR:",
    err.message
  );

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
      origin: req.headers.origin || null,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});