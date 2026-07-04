
const Onboarding = require("../models/Onboarding");
const { generateIdCard } = require("../utils/generateIdCard");

exports.generateTestIdCard = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const intern = await Onboarding.findOne({ email });

        if (!intern) {
            return res.status(404).json({
                success: false,
                message: "Intern not found."
            });
        }

        await generateIdCard(intern);

        res.json({
            success: true,
            message: "ID Card Generated Successfully."
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};