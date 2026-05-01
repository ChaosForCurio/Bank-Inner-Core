const ExchangeService = require("../services/exchange.service");
const TransactionService = require("../services/transaction.service");
const AccountModel = require("../models/account.model");

const ExchangeController = {
    /**
     * getRates - Returns current simulated exchange rates
     */
    async getRates(req, res) {
        try {
            const base = req.query.base || "INR";
            const rates = await ExchangeService.getRates(base);
            return res.json({ success: true, base, rates });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * convert - Preview a conversion
     */
    async preview(req, res) {
        try {
            const { from, to, amount } = req.body;
            if (!from || !to || !amount) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }

            const result = await ExchangeService.convert(amount, from, to);
            return res.json({ success: true, ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * execute - Performs the actual exchange between user wallets
     */
    async execute(req, res) {
        try {
            const { fromAccountId, toAccountId, amount } = req.body;
            const userId = req.user.id;

            if (!fromAccountId || !toAccountId || !amount) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }

            // 1. Verify accounts belong to user and get currencies
            const fromAccount = await AccountModel.findById(fromAccountId);
            const toAccount = await AccountModel.findById(toAccountId);

            if (!fromAccount || !toAccount || fromAccount.user_id !== userId || toAccount.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Access denied to one or more accounts" });
            }

            // 2. Perform conversion calculation
            const conversion = await ExchangeService.convert(amount, fromAccount.currency, toAccount.currency);

            // 3. Execute the transaction via TransactionService
            const result = await TransactionService.executeExchange({
                userId,
                fromAccountId,
                toAccountId,
                sourceAmount: conversion.sourceAmount,
                targetAmount: conversion.targetAmount,
                exchangeRate: conversion.rate,
                fromCurrency: fromAccount.currency,
                toCurrency: toAccount.currency
            });

            return res.json({ 
                success: true, 
                message: "Exchange successful", 
                transaction: result 
            });
        } catch (error) {
            console.error("Exchange Controller Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = ExchangeController;
