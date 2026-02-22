const UserModel = require("../models/user.model");
const AccountModel = require("../models/account.model");

/**
 * getUserByUuid - Look up a user and their primary account by UUID
 * GET /api/users/lookup/:uuid
 */
async function getUserByUuid(req, res) {
    try {
        const { uuid } = req.params;
        const user = await UserModel.findByUuid(uuid);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed"
            });
        }

        // Get primary account for the user
        const account = await AccountModel.findPrimaryByUserId(user.id);

        return res.status(200).json({
            status: "success",
            user: {
                name: user.name,
                uuid: user.uuid,
                accountId: account ? account.id : null
            }
        });
    } catch (error) {
        console.error("Get user by UUID error:", error);
        return res.status(500).json({
            message: "Failed to look up user",
            status: "failed"
        });
    }
}

module.exports = { getUserByUuid };
