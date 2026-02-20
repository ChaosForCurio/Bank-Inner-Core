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
        idempotencyKey
    })

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
    })

    await ledgerModel.create({
        accountId: toAccount,
        transactionId: transaction._id,
        amount,
        type: "credit",
        balance: toUserAccount.balance + amount
    })

    /**
     * - Send notifications
     */

    await emailService.sendTransactionNotification({
        to: fromUserAccount.email,
        amount,
        type: "debit"
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

    return res.status(201).json({
        message: "Transaction created successfully",
        transaction
    })

    /**
     * Derive sender balance
     */

    const balance = await fromUserAccount.getBalance()
    if (balance < amount) {
        return res.status(400).json({ message: `Insufficient balance. Please check your ${balance}. Requested amount is ${amount}` })
    }

    /**
     * Create Transaction (Pending)
     */

    const session = await neon.startSession()
    session.startTransaction()
}
