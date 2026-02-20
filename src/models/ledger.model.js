// const neon = require("neon")
// 
// const ledgerSchema = new neon.Schema({
//     accountId: {
//         type: neon.Schema.Types.ObjectId,
//         ref: "account",
//         required: [true, "Ledger must be associated with an account"],
//         index: true,
//         immutable: true
//     },
//     transactionId: {
//         type: neon.Schema.Types.ObjectId,
//         ref: "transaction",
//         required: [true, "Ledger must be associated with a transaction"],
//         index: true,
//         immutable: true
//     },
//     amount: {
//         type: Number,
//         required: [true, "Amount is required"],
//         immutable: true
//     },
//     type: {
//         type: String,
//         enum: ["credit", "debit"],
//         required: [true, "Transaction type is required"],
//         immutable: true
//     },
//     balance: {
//         type: Number,
//         required: [true, "Running balance is required"]
//     },
//     description: {
//         type: String,
//         default: ""
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// })
// 
// function preventLedgerModification() {
//     throw new Error("Ledger entries are immutable cannot be modified or deleted")
// }
// 
// ledgerSchema.pre("save", preventLedgerModification)
// ledgerSchema.pre("updateOne", preventLedgerModification)
// ledgerSchema.pre("updateMany", preventLedgerModification)
// ledgerSchema.pre("findOneAndUpdate", preventLedgerModification)
// ledgerSchema.pre("delete", preventLedgerModification)
// ledgerSchema.pre("deleteOne", preventLedgerModification)
// ledgerSchema.pre("deleteMany", preventLedgerModification)
// 
// 
// const Ledger = neon.model("Ledger", ledgerSchema)
// 
// module.exports = Ledger

module.exports = {}; // Export empty object for now
