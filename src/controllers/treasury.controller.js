const UserModel = require("../models/user.model");
const VaultModel = require("../models/vault.model");
const { sql } = require("../db");

const TreasuryController = {
    /**
     * getConfig - Get treasury configuration for the current user
     */
    async getConfig(req, res) {
        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) return res.status(404).json({ message: "User not found" });

            res.json({
                status: "success",
                data: user.treasury_config || {}
            });
        } catch (error) {
            res.status(500).json({ status: "failed", message: error.message });
        }
    },

    /**
     * updateConfig - Update treasury settings
     */
    async updateConfig(req, res) {
        try {
            const { tax_withholding_percentage, sweep_threshold, is_enabled } = req.body;
            const userId = req.user.id;

            // Merge with existing config
            const user = await UserModel.findById(userId);
            const currentConfig = user.treasury_config || {};
            
            const newConfig = {
                ...currentConfig,
                tax_withholding_percentage: tax_withholding_percentage !== undefined ? tax_withholding_percentage : currentConfig.tax_withholding_percentage,
                sweep_threshold: sweep_threshold !== undefined ? sweep_threshold : currentConfig.sweep_threshold,
                is_enabled: is_enabled !== undefined ? is_enabled : currentConfig.is_enabled
            };

            await sql`
                UPDATE users 
                SET treasury_config = ${JSON.stringify(newConfig)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${userId}
            `;

            res.json({
                status: "success",
                message: "Treasury configuration updated",
                data: newConfig
            });
        } catch (error) {
            res.status(500).json({ status: "failed", message: error.message });
        }
    },

    /**
     * getLogs - Get history of treasury actions
     */
    async getLogs(req, res) {
        try {
            const logs = await sql`
                SELECT * FROM treasury_logs 
                WHERE user_id = ${req.user.id} 
                ORDER BY created_at DESC 
                LIMIT 50
            `;
            res.json({ status: "success", data: logs });
        } catch (error) {
            res.status(500).json({ status: "failed", message: error.message });
        }
    },

    /**
     * getVaults - Get vaults with treasury metadata
     */
    async getVaults(req, res) {
        try {
            const vaults = await VaultModel.findByUserId(req.user.id);
            res.json({ status: "success", data: vaults });
        } catch (error) {
            res.status(500).json({ status: "failed", message: error.message });
        }
    }
};

module.exports = TreasuryController;
