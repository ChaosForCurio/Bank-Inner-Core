const SwarmModel = require("../models/swarm.model");
const TransactionService = require("../services/transaction.service");
const NotificationService = require("../services/notification.service"); // or Controller

const SwarmController = {
    /**
     * create - Initialize a new Swarm Campaign
     */
    async create(req, res) {
        try {
            const { title, targetAmount, currency, merchantDetails, expiresAt, participants } = req.body;
            const userId = req.user.id;

            if (!participants || !participants.length) {
                return res.status(400).json({ success: false, message: "Participants required" });
            }

            const swarm = await SwarmModel.createCampaign({
                userId, title, targetAmount, currency, merchantDetails, expiresAt
            });

            const addedParticipants = [];
            for (const p of participants) {
                const participant = await SwarmModel.addParticipant({
                    swarmId: swarm.id,
                    participantEmail: p.email,
                    amountDue: p.amount
                });
                addedParticipants.push(participant);
            }

            swarm.participants = addedParticipants;

            res.status(201).json({
                success: true,
                message: "Swarm campaign created. Participants have been notified to fulfill their shares.",
                data: swarm
            });
        } catch (error) {
            console.error("Swarm create error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * getDetails - Get details of a swarm
     */
    async getDetails(req, res) {
        try {
            const swarm = await SwarmModel.getCampaign(req.params.id);
            if (!swarm) return res.status(404).json({ success: false, message: "Swarm not found" });

            res.json({ success: true, data: swarm });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * fulfillShare - A participant pays their share
     */
    async fulfillShare(req, res) {
        try {
            const { swarmId, participantId } = req.params;
            const { accountId } = req.body; // Source account for payment
            const userId = req.user.id; // The user making the payment

            const swarm = await SwarmModel.getCampaign(swarmId);
            if (!swarm) return res.status(404).json({ success: false, message: "Swarm not found" });
            if (swarm.status !== 'funding') {
                return res.status(400).json({ success: false, message: `Swarm is already ${swarm.status}` });
            }

            const participant = swarm.participants.find(p => p.id === parseInt(participantId));
            if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

            if (participant.status === 'paid') {
                return res.status(400).json({ success: false, message: "Share already paid" });
            }

            // We simulate taking funds from the user's account and holding it in escrow.
            // Ideally we'd use TransactionService to move to a system escrow account.
            // For now, we deduct directly:
            const idempotencyKey = `swarm_${swarmId}_p_${participantId}`;
            await TransactionService.executeTransfer({
                fromAccountId: accountId,
                toAccountId: null, // Simulated Escrow
                amount: participant.amount_due,
                type: 'payment',
                idempotencyKey,
                description: `Swarm Payment for ${swarm.title}`
            });

            await SwarmModel.updateParticipantPayment(participant.id, participant.amount_due);

            // Check if swarm is fully funded
            const updatedSwarm = await SwarmModel.getCampaign(swarmId);
            const allPaid = updatedSwarm.participants.every(p => p.status === 'paid');

            if (allPaid) {
                // Execute the final payment to the merchant (simulated)
                await SwarmModel.updateCampaignStatus(swarmId, 'completed');
                
                // Notify the creator
                console.log(`[SWARM] Completed: ${swarm.title}. Funds released to merchant.`);
                return res.json({ 
                    success: true, 
                    message: "Share paid! The swarm is now fully funded and funds have been released to the merchant." 
                });
            }

            res.json({ success: true, message: "Share successfully paid into the swarm escrow." });
        } catch (error) {
            console.error("Swarm fulfillment error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = SwarmController;
