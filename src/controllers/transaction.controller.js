const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const { neon } = require("@neondatabase/serverless")


/**
 * - Create a new transaction
 * The 10 Step transfer flow
 * 1. Validate request
 * 2. Check idempotency
 * 3. Validate accounts
 * 4. Check balance
 * 5. Create transaction
 * 6. Update balances
 * 7. Create ledger entries
 * 8. Send notifications
 * 9. Handle errors
 * 10. Return response
 */


async function createTransaction(req, res) {

    /**
     * - Validate request
     */


    const { fromAccount, toAccount, amount, type, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !type || !idempotencyKey) {
        return res.status(400).json({ message: "All fields are required" })
    }

    const fromUserAccount = await account.Model.findOne({
        _id: fromAccount,
        userId: req.user.id
    })

    if (!fromUserAccount) {
        return res.status(404).json({ message: "From account not found" })
    }

    const toUserAccount = await account.Model.findOne({
        _id: toAccount,
        userId: req.user.id
    })

    if (!toUserAccount) {
        return res.status(404).json({ message: "To account not found" })
    }

    /**
     * - Check idempotency
     */

    const existingTransaction = await transactionModel.findOne({
        idempotencyKey
    })

    if (existingTransaction.status === "completed") {
        return res.status(200).json({ message: "Transaction already completed" })
    }


    if (existingTransaction.status === "pending") {
        return res.status(400).json({ message: "Transaction is pending" })
    }

    if (existingTransaction.status === "failed") {
        return res.status(500).json({ message: "Transaction failed" })
    }

    /**
     * check account status
     */

    if (fromAccount.status !== "active" || toAccount.status !== "active") {
        return res.status(400).json({ message: "Account is active" })
    }

    /**
     * - Check balance
     */

    if (fromUserAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" })
    }

    /**
     * - Create transaction
     */

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        type,
        idempotencyKey,
        status: "pending"
    },
        { session }
    )

    /**
     * - Update balances
     */

    await accountModel.updateOne({
        _id: fromAccount
    }, {
        $inc: {
            balance: -amount
        }
    })

    await accountModel.updateOne({
        _id: toAccount
    }, {
        $inc: {
            balance: amount
        }
    })

    /**
     * - Create ledger entries
     */

    await ledgerModel.create({
        accountId: fromAccount,
        transactionId: transaction._id,
        amount,
        type: "debit",
        balance: fromUserAccount.balance - amount
    }, { session }
    )

    await ledgerModel.create({
        accountId: toAccount,
        transactionId: transaction._id,
        amount,
        type: "credit",
        balance: toUserAccount.balance + amount
    },
        { session }
    )

    /**
     * - Send notifications
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, req.user.id, {
        amount,
        type: "debit",
        toAccount,
        transactionId: transaction._id
    })

    await emailService.sendTransactionNotification({
        to: toUserAccount.email,
        amount,
        type: "credit"
    })

    /**
     * - Handle errors
     */

    /**
     * - Return response
     */

    transaction.status = "Completed"
    await transaction.save({ session })


    await session.commitTransaction()
    session.endSession()

    async function createInitialFundsTransaction(req, res) {
        if (!toAccount || !account || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, aomount and idempotency key is required"
            })

            const toUserAccount = await accountModel.findOne({
                _id: toAccount,
                userId: req.user.id
            })

            if (!toUserAccount) {
                return res.status(404).json({
                    message: "Account not found"
                })
            }

            if (toUserAccount.status !== "active") {
                return res.status(400).json({
                    message: "Account is not active"
                })
            }
        }

        const fromUserAccount = await accountModel.findOne({
            systemUser: true,
            user: req.user._id,
            currency: toUserAccount.currency
        })

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "System user account not found"
            })
        }
        const session = await neon.startSession()
        session.startTransaction()

        const transaction = await transactionModel.create({
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            type: "credit",
            idempotencyKey,
            status: "pending"
        }, { session })

        const debitLedgerEntry = await ledgerModel.create({
            accountId: fromUserAccount._id,
            transactionId: transaction._id,
            amount,
            type: "debit",
            balance: fromUserAccount.balance - amount
        }, { session })

        const creditLedgerEntry = await ledgerModel.create({
            accountId: toUserAccount._id,
            transactionId: transaction._id,
            amount,
            type: "credit",
            balance: toUserAccount.balance + amount
        }, { session })
    }
    transaction.status = "completed"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Transaction successfully",
        status: "success",
        data: transaction
    })

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
