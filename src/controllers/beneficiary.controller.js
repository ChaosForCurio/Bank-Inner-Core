const BeneficiaryModel = require('../models/beneficiary.model');

const BeneficiaryController = {
    async create(req, res) {
        try {
            const { name, accountNumber, bankName, category } = req.body;
            const userId = req.user.id;

            if (!name || !accountNumber) {
                return res.status(400).json({ message: 'Name and account number are required' });
            }

            const beneficiary = await BeneficiaryModel.create({
                userId, name, accountNumber, bankName, category
            });

            res.status(201).json({ message: 'Beneficiary added', beneficiary });
        } catch (error) {
            console.error('Create beneficiary error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async list(req, res) {
        try {
            const beneficiaries = await BeneficiaryModel.findByUserId(req.user.id);
            res.status(200).json({ beneficiaries });
        } catch (error) {
            console.error('List beneficiaries error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async remove(req, res) {
        try {
            const { id } = req.params;
            const deleted = await BeneficiaryModel.delete(id, req.user.id);
            if (!deleted) return res.status(404).json({ message: 'Beneficiary not found' });
            res.status(200).json({ message: 'Beneficiary removed' });
        } catch (error) {
            console.error('Delete beneficiary error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = BeneficiaryController;
