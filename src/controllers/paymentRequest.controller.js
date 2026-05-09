const crypto = require("crypto");
const PaymentRequestModel = require("../models/paymentRequest.model");
const AccountModel = require("../models/account.model");
const TransactionModel = require("../models/transaction.model");
const NotificationService = require("../services/notification.service");
const UserModel = require("../models/user.model");

const PaymentRequestController = {
    /**
     * Create a new magic link
     * POST /api/payment-requests
     */
    async createRequest(req, res, next) {
        try {
            const { amount, currency = "USD", note, recipientId } = req.body;
            const requestorId = req.user.id;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: "Valid amount is required" });
            }

            // Generate secure token
            const token = crypto.randomBytes(32).toString("hex");
            
            // Set expiration to 24 hours from now
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const paymentRequest = await PaymentRequestModel.create({
                requestorId,
                token,
                amount,
                currency,
                note,
                expiresAt: expiresAt.toISOString()
            });

            // If a specific recipient is targeted, send an actionable push notification
            if (recipientId) {
                const requestor = await UserModel.findById(requestorId);
                await NotificationService.notifyPaymentRequest(
                    recipientId,
                    requestor ? requestor.name : 'A user',
                    amount,
                    currency,
                    token,
                    note
                );
            }

            res.status(201).json({
                success: true,
                message: "Payment request created successfully",
                paymentRequest: {
                    id: paymentRequest.id,
                    token: paymentRequest.token,
                    amount: paymentRequest.amount,
                    currency: paymentRequest.currency,
                    note: paymentRequest.note,
                    status: paymentRequest.status,
                    expiresAt: paymentRequest.expires_at
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get public details of a magic link
     * GET /api/payment-requests/:token
     */
    async getRequestByToken(req, res, next) {
        try {
            const { token } = req.params;

            const paymentRequest = await PaymentRequestModel.findByToken(token);

            if (!paymentRequest) {
                return res.status(404).json({ success: false, message: "Payment request not found or invalid link" });
            }

            // Check expiration
            if (new Date() > new Date(paymentRequest.expires_at) && paymentRequest.status === 'pending') {
                await PaymentRequestModel.updateStatus(paymentRequest.id, 'expired');
                paymentRequest.status = 'expired';
            }

            // Only return safe public details
            res.json({
                success: true,
                paymentRequest: {
                    token: paymentRequest.token,
                    amount: paymentRequest.amount,
                    currency: paymentRequest.currency,
                    note: paymentRequest.note,
                    status: paymentRequest.status,
                    requestorName: paymentRequest.requestor_name
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Fulfill a payment request
     * POST /api/payment-requests/:token/fulfill
     */
    async fulfillRequest(req, res, next) {
        try {
            const { token } = req.params;
            const payerId = req.user.id;

            const result = await PaymentRequestController._executeFulfillment(token, payerId);
            
            if (!result.success) {
                return res.status(result.status || 400).json(result);
            }

            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Respond to a payment request (Approve/Decline)
     * Useful for actionable push notifications
     * POST /api/payment-requests/:token/respond
     */
    async respondToRequest(req, res, next) {
        try {
            const { token } = req.params;
            const { action } = req.body; // 'approve' or 'decline'
            const userId = req.user.id;

            if (action === 'decline') {
                const paymentRequest = await PaymentRequestModel.findByToken(token);
                if (!paymentRequest) {
                    return res.status(404).json({ success: false, message: "Payment request not found" });
                }
                await PaymentRequestModel.updateStatus(paymentRequest.id, 'declined');
                return res.json({ success: true, message: "Payment request declined" });
            }

            if (action === 'approve') {
                const result = await PaymentRequestController._executeFulfillment(token, userId);
                if (!result.success) {
                    return res.status(result.status || 400).json(result);
                }
                return res.json(result);
            }

            res.status(400).json({ success: false, message: "Invalid action" });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Internal helper to execute fulfillment logic
     * @private
     */
    async _executeFulfillment(token, payerId) {
        const paymentRequest = await PaymentRequestModel.findByToken(token);

        if (!paymentRequest) {
            return { success: false, status: 404, message: "Payment request not found" };
        }

        if (paymentRequest.status !== 'pending') {
            return { success: false, message: `Payment request is already ${paymentRequest.status}` };
        }

        if (new Date() > new Date(paymentRequest.expires_at)) {
            await PaymentRequestModel.updateStatus(paymentRequest.id, 'expired');
            return { success: false, message: "Payment request has expired" };
        }

        if (paymentRequest.requestor_id === payerId) {
            return { success: false, message: "You cannot fulfill your own payment request" };
        }

        // Execute the transfer
        const payerAccounts = await AccountModel.findByUserId(payerId);
        const requestorAccounts = await AccountModel.findByUserId(paymentRequest.requestor_id);

        const fromAccount = payerAccounts[0];
        const toAccount = requestorAccounts[0];

        if (!fromAccount || !toAccount) {
            return { success: false, message: "Unable to find valid accounts for the transfer" };
        }

        if (Number(fromAccount.balance) < Number(paymentRequest.amount)) {
            return { success: false, message: "Insufficient funds" };
        }

        const idempotencyKey = `magic_link_${paymentRequest.id}_${Date.now()}`;

        await AccountModel.updateBalance(fromAccount.id, -Number(paymentRequest.amount));
        await AccountModel.updateBalance(toAccount.id, Number(paymentRequest.amount));

        await TransactionModel.create({
            fromAccount: fromAccount.id,
            toAccount: toAccount.id,
            amount: paymentRequest.amount,
            type: 'debit',
            idempotencyKey: `${idempotencyKey}_debit`,
            status: 'completed'
        });

        await TransactionModel.create({
            fromAccount: fromAccount.id,
            toAccount: toAccount.id,
            amount: paymentRequest.amount,
            type: 'credit',
            idempotencyKey: `${idempotencyKey}_credit`,
            status: 'completed'
        });

        await PaymentRequestModel.updateStatus(paymentRequest.id, 'completed');

        return {
            success: true,
            message: "Payment request fulfilled successfully"
        };
    }
};

module.exports = PaymentRequestController;
