const Onboarding = require("../models/Onboarding");
const { generateIdCard } = require("../utils/generateIdCard");

exports.generateTestIdCard = async (req, res) => {
  try {

    // Latest paid intern (ya latest onboarding)
    const intern = await Onboarding.findOne().sort({ createdAt: -1 });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "No onboarding record found."
      });
    }

    const joiningDate = new Date(
      intern.paymentDate || intern.createdAt
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pdfPath = await generateIdCard({
      fullName: intern.fullName,
      role: intern.role,
      internId: intern.internId || "DT00",
      joiningDate,
    });

    res.json({
      success: true,
      message: "ID Card Generated Successfully ✅",
      pdfPath,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};