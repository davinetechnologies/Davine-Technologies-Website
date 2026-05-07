const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

// ================= MIDDLEWARE =================

app.use(cors());

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

// ================= SERVER =================

const PORT =
process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});