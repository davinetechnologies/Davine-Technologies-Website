const cron = require("node-cron");
const Intern = require("./models/Intern");

// =====================================================
// AUTOMATIC WEEKLY UPDATE
// Every Monday at 12:05 AM
// =====================================================

function startWeeklyAutoUpdate() {
cron.schedule(
  "0 3 * * 1",
    async () => {
      try {
        console.log("🔄 Monday weekly update started...");

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
          `✅ Weekly update completed. Updated interns: ${result.modifiedCount}`
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