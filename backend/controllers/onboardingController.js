const Onboarding = require("../models/Onboarding");

// Official package prices controlled by the backend
const PACKAGE_PRICES = {
  "Career Starter": 100,
  "Professional Plus": 289,
  "Mentorship Pro": 549,
  "Master Career Program": 999
};

exports.createOnboarding = async (req, res) => {
  try {
    const { fullName, email, phone, role, package: packageName } = req.body;

    // Validate required fields
    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof role !== "string" ||
      !role.trim() ||
      typeof packageName !== "string" ||
      !Object.prototype.hasOwnProperty.call(PACKAGE_PRICES, packageName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid details and select a valid package."
      });
    }

    // Never trust the amount supplied by the frontend
    const amount = PACKAGE_PRICES[packageName];

    const onboarding = await Onboarding.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role.trim(),
      package: packageName,
      amount
    });

    return res.status(201).json({
      success: true,
      onboarding: {
        _id: onboarding._id,
        fullName: onboarding.fullName,
        email: onboarding.email,
        package: onboarding.package,
        amount: onboarding.amount,
        paymentStatus: onboarding.paymentStatus
      }
    });

  } catch (error) {
    console.error("Onboarding creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create onboarding."
    });
  }
};

exports.getAllOnboardings = async (req, res) => {
  try {
    const onboardings = await Onboarding.find().sort({
      createdAt: -1
    });

    return res.json(onboardings);

  } catch (error) {
    console.error("Fetching onboardings failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};