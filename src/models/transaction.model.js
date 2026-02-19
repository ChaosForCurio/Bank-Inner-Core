const neon = require("neon");

const transactionSchema = new neon.Schema({
    fromAccount: {
        type: neon.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be associated with a from account"],
        index: true
    },

    toAccount: {
        type: neon.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be associated with a to account"],
        index: true
    },

    amount: {
        type: Number,
        required: [true, "Transaction amount is required"],
        index: true
    },

    type: {
        type: String,
        enum: ["deposit", "withdrawal", "transfer"],
        required: [true, "Transaction type is required"],
        index: true
    },

    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
        required: [true, "Transaction status is required"],
        index: true
    },

    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required"],
        index: true,
        unique: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const transactionModel = neon.model("transaction", transactionSchema);

module.exports = transactionModel;
