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

            if (schedules.length === 0) return;

            console.log(`Found ${schedules.length} scheduled transfers to process.`);

            // 2. Process in batches to handle high load without overwhelming the DB
            const BATCH_SIZE = 5;
            for (let i = 0; i < schedules.length; i += BATCH_SIZE) {
                const batch = schedules.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(schedule => this.executeSingleSchedule(schedule)));
            }
            
        } catch (error) {
            console.error("Scheduler process error:", error);
        }
    },

    /**
     * executeSingleSchedule - Process a single schedule entry
     */
    async executeSingleSchedule(schedule) {
        console.log(`Processing schedule ${schedule.id}: ${schedule.amount} from ${schedule.from_account_id} to ${schedule.to_account_id}`);
        
        try {
            // 1. Execute the transfer
            const idempotencyKey = `scheduled_${schedule.id}_${schedule.next_run_date.getTime()}`;
            await TransactionService.executeTransfer({
                fromAccountId: schedule.from_account_id,
                toAccountId: schedule.to_account_id,
                amount: schedule.amount,
                type: 'transfer',
                idempotencyKey,
                description: `Scheduled transfer (${schedule.frequency})`
            });

            // 2. Update the schedule for next run or complete it
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

            // 3. Send Notifications
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

};

module.exports = SchedulerService;
