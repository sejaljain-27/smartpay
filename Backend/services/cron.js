import cron from "node-cron";
import pool from "../db.js";
import { createTransport } from "../utils/email.js";

const { EMAIL_FROM, SMTP_USER, EMAIL } = process.env;

export function initCronJobs() {
    console.log("Initializing cron jobs...");

    // Run daily at 20:00 (8 PM)
    cron.schedule("0 20 * * *", async () => {
        console.log("Running daily email report job...");
        try {
            await sendDailyReports();
        } catch (error) {
            console.error("Error running daily report job:", error);
        }
    });
}

async function sendDailyReports() {
    const transporter = createTransport();
    const from = EMAIL_FROM || SMTP_USER || EMAIL;

    // Get all verified users
    const usersResult = await pool.query("SELECT id, email, name FROM users WHERE is_verified = true");
    const users = usersResult.rows;

    console.log(`Sending daily reports to ${users.length} users...`);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const user of users) {
        try {
            // 1. Get Today's Expenses
            const expenseResult = await pool.query(
                `SELECT COALESCE(ABS(SUM(amount)), 0) AS total
                 FROM transactions
                 WHERE user_id = $1 AND amount < 0 AND DATE(created_at) = $2`,
                [user.id, todayStr]
            );
            const todayExpense = Number(expenseResult.rows[0].total);

            // 2. Get Goal Status
            const goalResult = await pool.query(
                "SELECT * FROM goals WHERE user_id = $1 AND month = $2 ORDER BY created_at DESC LIMIT 1",
                [user.id, monthStr]
            );

            let goalStatusHtml = "";
            let progressHtml = "";

            if (goalResult.rows.length > 0) {
                const goal = goalResult.rows[0];
                const spendingResult = await pool.query(
                    `SELECT COALESCE(SUM(amount), 0) AS spent
                   FROM transactions
                   WHERE user_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2`,
                    [user.id, monthStr]
                );

                // Logic update: "Savings Goal" - spent is actually saved (or consumed if budget).
                // Based on previous task, we treat it as:
                // Spent (saved) / Target

                const saved = Number(spendingResult.rows[0].spent);
                const target = Number(goal.target_amount);
                const percentage = Math.min(Math.round((saved / target) * 100), 100);

                const isOnTrack = percentage >= 80;
                const statusColor = isOnTrack ? "#10b981" : "#ef4444"; // Green : Red
                const statusText = isOnTrack ? "On Track" : "Not On Track";

                goalStatusHtml = `
                    <div style="margin-top: 20px; padding: 15px; background-color: #f4f4f5; border-radius: 10px;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Savings Goal Status</h3>
                        <p style="margin: 0; font-size: 16px;">
                            Target: <strong>₹${target}</strong> | Saved: <strong>₹${saved}</strong>
                        </p>
                         <p style="margin: 10px 0 0 0; font-weight: bold; color: ${statusColor};">
                            Current Status: ${statusText} (${percentage}%)
                        </p>
                    </div>
                `;
            } else {
                goalStatusHtml = `
                    <div style="margin-top: 20px; padding: 15px; background-color: #f4f4f5; border-radius: 10px;">
                        <p style="margin: 0; color: #666;">You haven't set a savings goal for this month yet.</p>
                    </div>
                `;
            }

            // 3. Send Email
            const subject = `Your Daily SpendWise Report - ${todayStr}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #10b981;">Daily Financial Update</h2>
                    <p>Hi ${user.name || 'there'},</p>
                    <p>Here is your financial summary for today, <strong>${todayStr}</strong>.</p>
                    
                    <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">TOTAL EXPENSE TODAY</div>
                        <div style="font-size: 32px; font-weight: bold;">₹${todayExpense}</div>
                    </div>

                    ${goalStatusHtml}

                    <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                        This is an automated report from SpendWise.
                    </p>
                </div>
            `;

            await transporter.sendMail({
                from,
                to: user.email,
                subject,
                html
            });
            console.log(`Report sent to ${user.email}`);

        } catch (err) {
            console.error(`Failed to send report to user ${user.id}:`, err);
        }
    }
}

// Export for manual testing
export { sendDailyReports };
