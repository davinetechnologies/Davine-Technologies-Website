const Onboarding = require("../models/Onboarding");

exports.createOnboarding = async (req, res) => {

  try {

    const onboarding = await Onboarding.create(req.body);

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