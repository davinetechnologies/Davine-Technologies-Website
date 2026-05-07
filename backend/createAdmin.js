require("dotenv").config();

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");

// ================= CONNECT DB =================

mongoose.connect(process.env.MONGO_URI)
.then(() => {

    console.log("MongoDB Connected");

})
.catch((error) => {

    console.log(error);

});

// ================= CREATE ADMIN =================

async function createAdmin() {

    try {

        const hashedPassword =
        await bcrypt.hash("prem123", 10);

        const admin =
        new Admin({

            email:
            "admin@davinetechnologies.com",

            password:
            hashedPassword,

        });

        await admin.save();

        console.log("Admin Created");

        process.exit();

    } catch (error) {

        console.log(error);

        process.exit();

    }

}

createAdmin();