const XLSX = require("xlsx");
const transporter = require("../config/mailConfig");

const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const Application = require("../models/Application");

// ================= APPLICATION SUBMIT =================

router.post(
    "/",
    upload.single("resume"),

    async (req, res) => {

        try {

            console.log("BODY RECEIVED:", req.body);

            const {
                fullName,
                email,
                role
            } = req.body;

            if (
                !fullName ||
                !email ||
                !role
            ) {

                return res.status(400).json({
                    success: false,
                    message: "All fields required",
                });

            }

            const savedData =
            await Application.create({

                fullName,
                email,
                role,

                resume: req.file
                    ? req.file.filename
                    : "",
            });

            console.log("SAVED:", savedData);

            // ================= RESPONSE =================

            res.status(201).json({
                success: true,
                message:
                "Application Submitted Successfully",
            });

            // ================= ADMIN EMAIL =================

            transporter.sendMail({

                from: process.env.EMAIL_USER,

                to: process.env.EMAIL_USER,

                subject: "New Internship Application",

                html: `

                    <h2>New Internship Application</h2>

                    <p><strong>Name:</strong> ${fullName}</p>

                    <p><strong>Email:</strong> ${email}</p>

                    <p><strong>Role:</strong> ${role}</p>

                `,

                attachments: [
                    {
                        filename: req.file.filename,
                        path: `uploads/${req.file.filename}`,
                    },
                ],

            })
            .then(() => {

                console.log("Admin Email Sent");

            })
            .catch((error) => {

                console.log("Admin Email Error:", error);

            });

            // ================= USER EMAIL =================

            transporter.sendMail({

                from: process.env.EMAIL_USER,

                to: email,

                subject:
                "Application Received - Davine Technologies",

                html: `

                    <h2>Thank You For Applying</h2>

                    <p>Hello ${fullName},</p>

                    <p>

                        Thank you for applying for the
                        <strong>${role}</strong>
                        position at Davine Technologies.

                    </p>

                    <p>

                        We have successfully received your
                        application and resume.

                    </p>

                    <p>

                        Our team will review your profile
                        and contact you shortly.

                    </p>

                    <br>

                    <p>
                        Best Regards,
                    </p>

                    <p>
                        <strong>Davine Technologies</strong>
                    </p>

                `,

            })
            .then(() => {

                console.log("User Email Sent");

            })
            .catch((error) => {

                console.log("User Email Error:", error);

            });

        } catch (error) {

            console.log("ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Server Error",
                error: error.message,
            });

        }

    }
);
// ================= GET ALL APPLICATIONS =================

router.get("/", async (req, res) => {

    try {

        const applications =
        await Application.find().sort({
            createdAt: -1,
        });

        res.json(applications);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });

    }

});
// ================= DELETE APPLICATION =================

router.delete("/:id", async (req, res) => {

    try {

        await Application.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true,
            message: "Application Deleted",
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });

    }

});
// ================= EXPORT EXCEL =================

router.get("/export/excel", async (req, res) => {

    try {

        const applications =
        await Application.find();

        const data =
        applications.map((app) => ({

            Name:
            app.fullName,

            Email:
            app.email,

            Role:
            app.role,

            Status:
            app.status,

            Resume:
            app.resume,

        }));

        const worksheet =
        XLSX.utils.json_to_sheet(data);

        const workbook =
        XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            "Applications"

        );

        XLSX.writeFile(
            workbook,
            "applications.xlsx"
        );

        res.download(
            "applications.xlsx"
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });

    }

});
module.exports = router;