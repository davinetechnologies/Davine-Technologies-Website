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

// ================= SECURITY =================

app.use(helmet());

app.use(morgan("dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// ================= MIDDLEWARE =================

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.use("/uploads", express.static("uploads"));

// ================= DATABASE =================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
// ================= ROUTES =================

const applicationRoutes =
  require("./routes/applicationRoutes");

const contactRoutes =
  require("./routes/contactRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

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

// ================= HEALTH ROUTE =================

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

// ================= SERVER =================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});