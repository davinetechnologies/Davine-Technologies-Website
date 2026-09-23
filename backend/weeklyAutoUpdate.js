const cron = require("node-cron");
const Intern = require("./models/Intern");
const PortalProfile = require("./models/PortalProfile");

// =====================================================
// AUTOMATIC WEEKLY UPDATE
// Every Monday at 3:00 AM IST
// =====================================================

function startWeeklyAutoUpdate() {
  cron.schedule(
    "0 3 * * 1",
    async () => {
      try {
        console.log("🔄 Monday weekly update started...");

        // =====================================================
        // 1. UPDATE INTERN WEEK
        // =====================================================

        const result = await Intern.updateMany(
          {
            status: "Active",
            currentWeek: { $lt: 12 },
          },
          {
            $inc: {
              currentWeek: 1,
              upcomingWeek: 1,
            },
          }
        );

        console.log(
          `✅ Intern weekly update completed. Updated interns: ${result.modifiedCount}`
        );

        // =====================================================
        // 2. SYNC PORTAL PROFILE WITH INTERN WEEK
        // Intern.currentWeek = SOURCE OF TRUTH
        // =====================================================

        const activeInterns = await Intern.find({
          status: "Active",
        }).select("email currentWeek");

        let syncedProfiles = 0;

        for (const intern of activeInterns) {
          const profileResult = await PortalProfile.updateOne(
            {
              email: intern.email,
            },
            {
              $set: {
                currentWeek: Number(intern.currentWeek) || 1,
              },
            }
          );

          if (profileResult.modifiedCount > 0) {
            syncedProfiles++;
          }
        }

        console.log(
          `🔄 Portal profiles synced: ${syncedProfiles}`
        );

        console.log(
          "✅ Weekly update + portal sync completed successfully."
        );

      } catch (error) {
        console.error(
          "❌ Weekly auto-update failed:",
          error.message
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "📅 Weekly auto-update scheduler started."
  );
}

module.exports = startWeeklyAutoUpdate;