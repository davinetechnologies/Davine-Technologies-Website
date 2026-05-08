const axios = require("axios");
const XLSX = require("xlsx");

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

      // ================= ADMIN EMAIL =================

      await axios.post(
        "https://api.brevo.com/v3/smtp/email",

        {
          sender: {
            name: "Davine Technologies",
            email: process.env.EMAIL_USER,
          },

          to: [
            {
              email: process.env.EMAIL_USER,
            },
          ],

          subject: "New Internship Application",

          htmlContent: `

            <h2>New Internship Application</h2>

            <p><strong>Name:</strong> ${fullName}</p>

            <p><strong>Email:</strong> ${email}</p>

            <p><strong>Role:</strong> ${role}</p>

          `,
        },

        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Admin Email Sent");

      // ================= USER EMAIL =================

      await axios.post(
        "https://api.brevo.com/v3/smtp/email",

        {
          sender: {
            name: "Davine Technologies",
            email: process.env.EMAIL_USER,
          },

          to: [
            {
              email: email,
            },
          ],

          subject:
          "Application Received - Davine Technologies",

          htmlContent: `

            <h2>Thank You For Applying</h2>

            <p>Hello ${fullName},</p>

            <p>

              Applying for the
              <strong>${role}</strong>
              position at Davine Technologies.

            </p>

            <p>

              We have successfully received your
              application and resume.

            </p>

          `,
        },

        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("User Email Sent");

      // ================= RESPONSE =================

      res.status(201).json({
        success: true,
        message:
        "Application Submitted Successfully",
      });

    } catch (error) {

      console.log("ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Server Error",
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

// ================= UPDATE STATUS =================

router.put("/:id", async (req, res) => {

  try {

    const { status } = req.body;

    const application =
    await Application.findById(
      req.params.id
    );

    if (!application) {

      return res.status(404).json({
        message: "Application Not Found",
      });

    }

    application.status = status;

    await application.save();

    let subject = "";

    let html = "";

    // SELECTED

    if (status === "Selected") {

      subject =
      "Congratulations - Davine Technologies";

      html = `

        <h2>
          Congratulations
          ${application.fullName} 🎉
        </h2>

        <p>

          You have been selected for the
          <strong>${application.role}</strong>
          position at Davine Technologies.

        </p>

      `;

    }

    // REJECTED

    else if (status === "Rejected") {

      subject =
      "Application Update - Davine Technologies";

      html = `

        <h2>
          Thank You For Applying
        </h2>

        <p>

          Dear ${application.fullName},

        </p>

        <p>

          We appreciate your interest in
          Davine Technologies.

        </p>

        <p>

          Unfortunately, you were not selected
          for the
          <strong>${application.role}</strong>
          position.

        </p>

      `;

    }

    // ================= STATUS EMAIL =================

    if (
      status === "Selected" ||
      status === "Rejected"
    ) {

      await axios.post(
        "https://api.brevo.com/v3/smtp/email",

        {
          sender: {
            name: "Davine Technologies",
            email: process.env.EMAIL_USER,
          },

          to: [
            {
              email: application.email,
            },
          ],

          subject,

          htmlContent: html,
        },

        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Status Email Sent");

    }

    res.json({

      success: true,
      message: "Status Updated",

    });

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