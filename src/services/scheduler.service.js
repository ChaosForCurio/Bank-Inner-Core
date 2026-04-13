const cron = require("node-cron");
const { sql } = require("../db");
const TransactionService = require("./transaction.service");
const NotificationController = require("../controllers/notification.controller");

const SchedulerService = {
    /**
     * start - Initialize the cron jobs
     */
    start() {
        console.log("Starting Scheduler Service...");
        
        // Run every minute
        cron.schedule("* * * * *", async () => {
            console.log("Checking for scheduled transfers...");
            await this.processScheduledTransfers();
        });
    },

    /**
     * processScheduledTransfers - Scan and execute pending schedules
     */
    async processScheduledTransfers() {
        try {
            // 1. Find all active schedules due for execution
            const schedules = await sql`
                SELECT * FROM scheduled_transfers 
                WHERE status = 'active' AND next_run_date <= CURRENT_TIMESTAMP
            `;

            for (const schedule of schedules) {
                console.log(`Processing schedule ${schedule.id}: ${schedule.amount} from ${schedule.from_account_id} to ${schedule.to_account_id}`);
                
                try {
                    // 2. Execute the transfer
                    const idempotencyKey = `scheduled_${schedule.id}_${schedule.next_run_date.getTime()}`;
                    await TransactionService.executeTransfer({
                        fromAccountId: schedule.from_account_id,
                        toAccountId: schedule.to_account_id,
                        amount: schedule.amount,
                        type: 'transfer',
                        idempotencyKey,
                        description: `Scheduled transfer (${schedule.frequency})`
                    });

                    // 3. Update the schedule for next run or complete it
                    let nextRun = null;
                    let newStatus = 'active';

                    if (schedule.frequency === 'once') {
                        newStatus = 'completed';
                    } else if (schedule.frequency === 'daily') {
                        nextRun = new Date(schedule.next_run_date.getTime() + 24 * 60 * 60 * 1000);
                    } else if (schedule.frequency === 'weekly') {
                        nextRun = new Date(schedule.next_run_date.getTime() + 7 * 24 * 60 * 60 * 1000);
                    } else if (schedule.frequency === 'monthly') {
                        nextRun = new Date(schedule.next_run_date.getTime());
                        nextRun.setMonth(nextRun.getMonth() + 1);
                    }

                    if (newStatus === 'completed') {
                        await sql`UPDATE scheduled_transfers SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ${schedule.id}`;
                    } else {
                        await sql`UPDATE scheduled_transfers SET next_run_date = ${nextRun}, updated_at = CURRENT_TIMESTAMP WHERE id = ${schedule.id}`;
                    }

                    // 4. Send Notifications
                    const fromAccount = await sql`SELECT user_id FROM accounts WHERE id = ${schedule.from_account_id}`;
                    const toAccount = await sql`SELECT user_id FROM accounts WHERE id = ${schedule.to_account_id}`;
                    
                    if (fromAccount.length > 0) {
                        await NotificationController.createInternal(
                            fromAccount[0].user_id,
                            "Scheduled Transfer Executed",
                            `Your ${schedule.frequency} transfer of ${schedule.amount} was successful.`,
                            'success'
                        );
                    }
                    if (toAccount.length > 0) {
                        await NotificationController.createInternal(
                            toAccount[0].user_id,
                            "Payment Received",
                            `You received ${schedule.amount} via a scheduled transfer.`,
                            'success'
                        );
                    }

                } catch (transferError) {
                    console.error(`Failed to execute schedule ${schedule.id}:`, transferError.message);
                    
                    // If it's a "once" transfer, we might want to mark it as failed? 
                    // For now, let's keep it active so it retries, or we could add a "retries" count.
                    // For simplicity, we'll notify the user.
                    const account = await sql`SELECT user_id FROM accounts WHERE id = ${schedule.from_account_id}`;
                    if (account.length > 0) {
                        await NotificationController.createInternal(
                            account[0].user_id,
                            "Scheduled Transfer Failed",
                            `Failed to execute your ${schedule.frequency} transfer of ${schedule.amount}: ${transferError.message}`,
                            'error'
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Scheduler process error:", error);
        }
    }
};

module.exports = SchedulerService;
