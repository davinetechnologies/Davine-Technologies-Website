const mongoose = require("mongoose");
const InternCollection = require("../models/InternCollection.model");
// SYNC ONBOARDING DATA TO INTERN COLLECTION
exports.syncOnboardings = async (req, res) => {
  try {
    const onboardingCollection =
      mongoose.connection.db.collection("onboardings");

    const onboardings = await onboardingCollection.find({}).toArray();

    let synced = 0;

    for (const data of onboardings) {

      const email = String(data.email || "").trim().toLowerCase();

      if (!email) continue;

      const internId = String(
        data.internId ||
        data.internID ||
        data.intern_id ||
        ""
      ).trim();

      const fullName = String(
        data.fullName ||
        data.name ||
        ""
      ).trim();

      const phone = String(
        data.phone ||
        data.phoneNumber ||
        ""
      ).trim();

      const domain = data.domain || "DevOps";

      const currentWeek = Number(
        data.currentWeek || 1
      );

      const upcomingWeek = Number(
        data.upcomingWeek || currentWeek + 1
      );

      await InternCollection.findOneAndUpdate(
        { email: email },
        {
          $set: {
            internId,
            fullName,
            email,
            phone,
            domain,
            currentWeek,
            upcomingWeek
          },
          $setOnInsert: {
            accessType: internId
              ? "WITH_ID_CARD"
              : "NO_ID_CARD"
          }
        },
        {
          upsert: true,
          new: true
        }
      );

      synced++;
    }

    return res.json({
      success: true,
      message: "Onboarding data synced successfully.",
      totalOnboardings: onboardings.length,
      synced
    });

  } catch (error) {
    console.error("Sync onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to sync onboarding data."
    });
  }
};

// =====================================================
// SAVE INTERN DATA
// POST /api/intern-collection/submit
// =====================================================
exports.submitIntern = async (req, res) => {
  try {
    const {
      accessType,
      internId,
      fullName,
      email,
      phone,
      domain,
      currentWeek,
      upcomingWeek
    } = req.body;

    if (!accessType || !email || !currentWeek || !upcomingWeek) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing."
      });
    }


    // =================================================
    // WITH INTERN ID
    // =================================================
    if (accessType === "WITH_ID_CARD") {

      if (!internId) {
        return res.status(400).json({
          success: false,
          message: "Intern ID is required."
        });
      }

      // Check if this intern already exists
      const existingIntern = await InternCollection.findOne({
        internId: internId.trim()
      });

      if (existingIntern) {

        existingIntern.email = email.trim().toLowerCase();
        existingIntern.currentWeek = Number(currentWeek);
        existingIntern.upcomingWeek = Number(upcomingWeek);

        await existingIntern.save();

        return res.status(200).json({
          success: true,
          message: "Intern weekly details updated successfully.",
          intern: existingIntern
        });
      }


      // First time ID intern is submitting
      const intern = await InternCollection.create({
        accessType: "WITH_ID_CARD",
        internId: internId.trim(),

        // Temporary values because ID form doesn't collect these
        fullName: fullName || "Intern",
        email: email.trim().toLowerCase(),
        phone: phone || "N/A",
        domain: domain || "Cloud",

        currentWeek: Number(currentWeek),
        upcomingWeek: Number(upcomingWeek)
      });

      return res.status(201).json({
        success: true,
        message: "Intern data saved successfully.",
        intern
      });
    }


    // =================================================
    // WITHOUT INTERN ID
    // =================================================
    if (accessType === "NO_ID_CARD") {

      if (!fullName || !email || !phone || !domain) {
        return res.status(400).json({
          success: false,
          message: "Name, email, phone and domain are required."
        });
      }

      const intern = await InternCollection.create({
        accessType: "NO_ID_CARD",
        internId: "",

        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        domain,

        currentWeek: Number(currentWeek),
        upcomingWeek: Number(upcomingWeek)
      });

      return res.status(201).json({
        success: true,
        message: "Intern data saved successfully.",
        intern
      });
    }


    return res.status(400).json({
      success: false,
      message: "Invalid access type."
    });

  } catch (error) {

    console.error("Save intern error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save intern data."
    });
  }
};


// =====================================================
// UPDATE WEEK FOR INTERN
// PUT /api/intern-collection/update-week
// =====================================================
exports.updateWeek = async (req, res) => {
  try {
    const {
      internId,
      email,
      currentWeek,
      upcomingWeek
    } = req.body;

    // Email + weeks required
    if (!email || !currentWeek || !upcomingWeek) {
      return res.status(400).json({
        success: false,
        message: "Email, current week and upcoming week are required."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanInternId = internId
      ? internId.trim()
      : "";

    // -------------------------------------------------
    // FIND INTERN BY REGISTERED EMAIL
    // -------------------------------------------------
    let intern = await InternCollection.findOne({
      email: cleanEmail
    });

    // -------------------------------------------------
    // IF EMAIL NOT FOUND, TRY INTERN ID
    // -------------------------------------------------
    if (!intern && cleanInternId) {
      intern = await InternCollection.findOne({
        internId: cleanInternId
      });
    }

    // -------------------------------------------------
    // IF STILL NOT FOUND
    // -------------------------------------------------
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern record not found."
      });
    }

    // -------------------------------------------------
    // UPDATE WEEK
    // -------------------------------------------------
    intern.currentWeek = Number(currentWeek);
    intern.upcomingWeek = Number(upcomingWeek);

    // Update ID if provided
    if (cleanInternId) {
      intern.internId = cleanInternId;
    }

    await intern.save();

    return res.status(200).json({
      success: true,
      message: "Intern weekly details updated successfully.",
      intern
    });

  } catch (error) {
    console.error("Update week error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update intern data."
    });
  }
};

// =====================================================
// GET ALL INTERN DATA
// GET /api/intern-collection/interns
// =====================================================
exports.getAllInterns = async (req, res) => {

  try {

    const interns = await InternCollection
      .find()
      .sort({ createdAt: -1 });


    return res.json({
      success: true,
      count: interns.length,
      interns
    });


  } catch (error) {

    console.error("Get interns error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch intern data."
    });

  }

};