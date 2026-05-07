const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

// ================= ADMIN LOGIN =================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const admin =
        await Admin.findOne({ email });

        if (!admin) {

            return res.status(400).json({
                success: false,
                message: "Admin not found",
            });

        }

        const isMatch =
        await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {

            return res.status(400).json({
                success: false,
                message: "Invalid Password",
            });

        }

        const token = jwt.sign(

            {
                id: admin._id,
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d",
            }

        );

        res.json({
            success: true,
            token,
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });

    }

});

module.exports = router;