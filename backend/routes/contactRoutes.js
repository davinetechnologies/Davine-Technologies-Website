const express = require("express");
const router = express.Router();

const Contact = require("../models/contact");

router.post("/", async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message
        } = req.body;

        if (
            !name ||
            !email ||
            !subject ||
            !message
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const newContact = new Contact({
            name,
            email,
            subject,
            message,
        });

        await newContact.save();

        res.status(201).json({
            success: true,
            message: "Message Sent Successfully",
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});
// ================= GET ALL CONTACT MESSAGES =================

router.get("/", async (req, res) => {

    try {

        const contacts =
        await Contact.find().sort({
            createdAt: -1,
        });

        res.json(contacts);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });

    }

});
// ================= DELETE CONTACT MESSAGE =================

router.delete("/:id", async (req, res) => {

    try {

        await Contact.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true,
            message: "Message Deleted",
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });

    }

});
module.exports = router;