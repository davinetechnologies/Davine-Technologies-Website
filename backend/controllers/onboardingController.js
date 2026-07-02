const Onboarding = require("../models/Onboarding");

exports.createOnboarding = async (req, res) => {

  try {

    const {
      fullName,
      email,
      phone,
      role,
      package,
      amount
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields."
      });
    }

    const onboarding = await Onboarding.create({
      fullName,
      email,
      phone,
      role,
      package,
      amount
    });

    res.status(201).json({
      success: true,
      onboarding
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create onboarding"
    });

  }

};

exports.getAllOnboardings = async (req, res) => {

  try {

    const onboardings = await Onboarding.find().sort({
      createdAt: -1
    });

    res.json(onboardings);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};