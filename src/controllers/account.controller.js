const AccountModel = require("../models/account.model")

async function createAccountController(req, res) {
    try {
        const userId = req.user.id;
        const account = await AccountModel.create({ userId })
        return res.status(201).json({
            status: "success",
            account
        })
    } catch (error) {
        console.error("Create account error:", error);
        return res.status(500).json({ message: "Failed to create account" });
    }
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await AccountModel.findByUserId(req.user.id)
        return res.status(200).json({
            status: "success",
            accounts
        })
    } catch (error) {
        console.error("Get accounts error:", error);
        return res.status(500).json({ message: "Failed to retrieve accounts" });
    }
}

async function getUserAccountBalanceController(req, res) {
    try {
        const accountId = req.params.accountId;
        const account = await AccountModel.findById(accountId)

        if (!account || account.user_id !== req.user.id) {
            return res.status(404).json({
                message: "Account not found"
            })
        }

        return res.status(200).json({
            status: "success",
            accountId: account.id,
            balance: account.balance
        })
    } catch (error) {
        console.error("Get balance error:", error);
        return res.status(500).json({ message: "Failed to retrieve balance" });
    }
}

module.exports = { createAccountController, getUserAccountsController, getUserAccountBalanceController }