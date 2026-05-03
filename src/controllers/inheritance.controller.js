const InheritanceModel = require("../models/inheritance.model");

const InheritanceController = {
    async getConfig(req, res) {
        try {
            const config = await InheritanceModel.getByUser(req.user.id);
            res.json({
                status: "success",
                data: config || null
            });
        } catch (error) {
            console.error("Get Inheritance Config Error:", error.message);
            res.status(500).json({ message: "Failed to retrieve configuration" });
        }
    },

    async configure(req, res) {
        const { beneficiaryId, triggerMonths } = req.body;
        const userId = req.user.id;

        if (!beneficiaryId || !triggerMonths) {
            return res.status(400).json({ message: "Beneficiary ID and trigger months are required" });
        }

        if (triggerMonths < 1 || triggerMonths > 60) {
            return res.status(400).json({ message: "Trigger months must be between 1 and 60" });
        }

        try {
            const config = await InheritanceModel.upsert({ userId, beneficiaryId, triggerMonths });
            await InheritanceModel.logAction(userId, "CONFIGURED", `Set to trigger after ${triggerMonths} months to beneficiary ID ${beneficiaryId}`);
            
            res.status(200).json({
                status: "success",
                message: "Inheritance protocol configured successfully",
                data: config
            });
        } catch (error) {
            console.error("Configure Inheritance Error:", error.message);
            res.status(500).json({ message: "Failed to configure inheritance protocol" });
        }
    },

    async cancel(req, res) {
        try {
            const config = await InheritanceModel.getByUser(req.user.id);
            if (!config) {
                return res.status(404).json({ message: "Configuration not found" });
            }

            await InheritanceModel.updateStatus(config.id, 'cancelled', 0);
            await InheritanceModel.logAction(req.user.id, "CANCELLED", "Inheritance protocol cancelled by user");

            res.json({
                status: "success",
                message: "Inheritance protocol cancelled"
            });
        } catch (error) {
            res.status(500).json({ message: "Failed to cancel protocol" });
        }
    }
};

module.exports = InheritanceController;
