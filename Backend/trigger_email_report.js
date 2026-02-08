
import "dotenv/config";
import { initDb } from "./db.js";
import { sendDailyReports } from "./services/cron.js";

async function run() {
    await initDb();
    console.log("Validating email config...");
    console.log("USER:", process.env.SMTP_USER);
    console.log("PASS:", process.env.SMTP_PASS ? "****" : "MISSING");

    console.log("Triggering daily report manually...");
    await sendDailyReports();
    console.log("Done.");
    process.exit(0);
}

run();
