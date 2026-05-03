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

        // Run daily at midnight (or every hour, but daily makes sense for inheritance)
        cron.schedule("0 0 * * *", async () => {
            console.log("Running Inheritance Dead Man's Switch checks...");
            await this.processInheritanceChecks();
        });

        // Run every minute to check for expired Swarm Campaigns
        cron.schedule("0 * * * *", async () => {
            console.log("Checking for expired Swarm campaigns...");
            await this.processSwarmExpirations();
        });

        // Run every 10 seconds to process the Outbox (high priority)
        cron.schedule("*/10 * * * * *", async () => {
            await this.processOutbox();
        });
    },

    /**
     * processSwarmExpirations - Refund expired funding campaigns
     */
    async processSwarmExpirations() {
        try {
            const SwarmModel = require("../models/swarm.model");
            const expiredSwarms = await SwarmModel.getExpiredFundingCampaigns();

            if (expiredSwarms.length === 0) return;

            console.log(`Found ${expiredSwarms.length} expired swarm campaigns to refund.`);

            for (const swarm of expiredSwarms) {
                // Get participants who paid
                const fullSwarm = await SwarmModel.getCampaign(swarm.id);
                for (const p of fullSwarm.participants) {
                    if (p.amount_paid > 0) {
                        console.log(`[SWARM] Refunding ${p.amount_paid} to ${p.participant_email} for swarm ${swarm.title}`);
                        // In a real system, we'd find the user's primary account and credit it.
                        // For now, we log the intent.
                    }
                }
                await SwarmModel.updateCampaignStatus(swarm.id, 'expired');
            }
        } catch (error) {
            console.error("Swarm expiration check error:", error);
        }
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
    },

    /**
     * processInheritanceChecks - Verify user activity and escalate protocol
     */
    async processInheritanceChecks() {
        try {
            const InheritanceModel = require("../models/inheritance.model");
            const EmailService = require("./email.service");
            const PushService = require("./push.service");
            const AccountModel = require("../models/account.model");
            
            const triggers = await InheritanceModel.getActiveTriggers();
            if (!triggers.length) return;

            console.log(`Processing ${triggers.length} inheritance triggers.`);

            for (const trigger of triggers) {
                // If the user's last login is updated AFTER the last_contacted_at, reset protocol
                if (trigger.last_contacted_at && new Date(trigger.last_login) > new Date(trigger.last_contacted_at)) {
                    await InheritanceModel.updateStatus(trigger.id, 'active', 0);
                    await InheritanceModel.logAction(trigger.user_id, "RESET", "User activity detected, protocol reset");
                    continue;
                }

                const escalation = trigger.escalation_stage;
                
                if (escalation === 0) {
                    // Stage 1: Send Push & Email warning
                    await PushService.sendToUser(trigger.user_id, {
                        title: "Action Required",
                        body: "We haven't seen you in a while. Please log in to prevent your inheritance protocol from activating."
                    });
                    
                    // We simulate email
                    console.log(`[Inheritance] Stage 1 Warning sent to ${trigger.email}`);
                    
                    await InheritanceModel.updateStatus(trigger.id, 'escalating', 1);
                    await InheritanceModel.logAction(trigger.user_id, "ESCALATION_STAGE_1", "Initial warning sent");
                
                } else if (escalation === 1) {
                    // Check if 7 days have passed since Stage 1
                    const diffDays = (Date.now() - new Date(trigger.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays >= 7) {
                        console.log(`[Inheritance] Stage 2 Warning (SMS/Urgent) sent to ${trigger.email}`);
                        await InheritanceModel.updateStatus(trigger.id, 'escalating', 2);
                        await InheritanceModel.logAction(trigger.user_id, "ESCALATION_STAGE_2", "Final warning sent");
                    }
                } else if (escalation === 2) {
                    // Check if 30 days have passed since Stage 1
                    const diffDays = (Date.now() - new Date(trigger.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays >= 30) { // Execute protocol
                        console.log(`[Inheritance] EXECUTING PROTOCOL for ${trigger.email}`);
                        
                        // Transfer all funds or grant access
                        // In this implementation, we simulate transferring vault balances
                        const vaults = await sql`SELECT * FROM vaults WHERE user_id = ${trigger.user_id}`;
                        const totalVaultBalance = vaults.reduce((sum, v) => sum + parseFloat(v.balance), 0);

                        if (totalVaultBalance > 0) {
                            console.log(`[Inheritance] Transferring ${totalVaultBalance} to beneficiary ${trigger.beneficiary_email}`);
                            // We would normally execute a real transfer here.
                        }

                        await InheritanceModel.updateStatus(trigger.id, 'executed', 3);
                        await InheritanceModel.logAction(trigger.user_id, "EXECUTED", `Protocol executed. Granted access to beneficiary ${trigger.beneficiary_email}`);
                        
                        // Send final notice to beneficiary
                        console.log(`[Inheritance] Notice sent to Beneficiary: ${trigger.beneficiary_email}`);
                    }
                }
            }
        } catch (error) {
            console.error("Inheritance check error:", error);
        }
    },

    /**
     * processOutbox - Reliable event delivery and cross-platform sync
     */
    async processOutbox() {
        const FirebaseService = require("./firebase.service");
        const WebhookService = require("./webhook.service");
        const AccountModel = require("../models/account.model");

        try {
            const pendingEvents = await sql`
                SELECT * FROM outbox 
                WHERE status = 'pending' 
                ORDER BY created_at ASC 
                LIMIT 10
            `;

            if (pendingEvents.length === 0) return;

            console.log(`[Outbox] Processing ${pendingEvents.length} events...`);

            for (const event of pendingEvents) {
                try {
                    // Update status to processing to avoid double delivery
                    await sql`UPDATE outbox SET status = 'processing' WHERE id = ${event.id}`;

                    if (event.event_type === 'transaction.completed') {
                        const { transactionId, fromAccountId, toAccountId, updatedBalances } = event.payload;

                        // 1. Sync to Firebase for Real-time Dashboard (Cross-Platform)
                        const fromAccount = await AccountModel.findById(fromAccountId);
                        const toAccount = await AccountModel.findById(toAccountId);

                        if (fromAccount) {
                            await FirebaseService.syncBalance(fromAccount.user_id, fromAccountId, updatedBalances.from);
                        }
                        if (toAccount) {
                            await FirebaseService.syncBalance(toAccount.user_id, toAccountId, updatedBalances.to);
                        }

                        // 2. Reliable Webhook Trigger
                        // (Now it lives here instead of the service to ensure it happens even if the process restarts)
                        const [tx] = await sql`SELECT * FROM transactions WHERE id = ${transactionId}`;
                        if (tx) {
                            await WebhookService.trigger('transaction.completed', tx);
                        }
                    }

                    // Mark as completed
                    await sql`
                        UPDATE outbox 
                        SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
                        WHERE id = ${event.id}
                    `;
                } catch (eventError) {
                    console.error(`[Outbox] Failed to process event ${event.id}:`, eventError.message);
                    await sql`
                        UPDATE outbox 
                        SET status = 'failed', error_message = ${eventError.message} 
                        WHERE id = ${event.id}
                    `;
                }
            }
        } catch (error) {
            console.error("Outbox process error:", error);
        }
    }
};

module.exports = SchedulerService;

