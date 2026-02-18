const neon = require("neondb");

const accountSchema = new neon.Schema(
    {
        userId: {
            type: neon.Schema.Types.ObjectId,
            ref: "user",
            required: true, message: "User ID is required",
            index: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "closed", "frozen"],
            message: "Status can be either active, inactive, closed, or frozen",
            default: "active",
        },
        currency: {
            type: String,
            required: true, message: "Currency is required",
            default: "INR",
        },
        timestamps: true,
    })

accountSchema.index({ userId: 1, status: 1 })

const AccountModel = neon.model("account", accountSchema)

module.exports = AccountModel