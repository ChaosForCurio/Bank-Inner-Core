const { sql } = require("../db");
const bcrypt = require("bcryptjs");

const UserModel = {
    /**
     * findOne - Find a user by query (only email supported for now)
     */
    async findOne({ email }) {
        try {
            const users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            console.error("Error in UserModel.findOne:", error);
            throw error;
        }
    },

    /**
     * findById - Find a user by ID
     */
    async findById(id) {
        try {
            const users = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            console.error("Error in UserModel.findById:", error);
            throw error;
        }
    },

    /**
     * create - Create a new user
     */
    async create({ email, password, name, isSystem = false }) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            const users = await sql`
        INSERT INTO users (email, password, name, status, is_system)
        VALUES (${email}, ${hashedPassword}, ${name}, 'active', ${isSystem})
        RETURNING id, email, name, status, is_system, created_at
      `;

            const user = users[0];
            return {
                ...user,
                _id: user.id
            };
        } catch (error) {
            console.error("Error in UserModel.create:", error);
            throw error;
        }
    },

    /**
     * ensureSystemUser - Ensures a system user exists, creating one if not.
     */
    async ensureSystemUser() {
        try {
            const systemEmail = "system@bank.com";
            let systemUser = await this.findOne({ email: systemEmail });

            if (!systemUser) {
                console.log("Creating system user...");
                systemUser = await this.create({
                    email: systemEmail,
                    password: "system_internal_password_" + Math.random(), // Should be secure or managed
                    name: "System",
                    isSystem: true
                });
            }

            // Ensure system user has a bank account
            const AccountModel = require("./account.model");
            const accounts = await AccountModel.findByUserId(systemUser.id);
            if (accounts.length === 0) {
                console.log("Creating bank account for system user...");
                await AccountModel.create({
                    userId: systemUser.id,
                    status: "active",
                    currency: "INR"
                });
            }

            return systemUser;
        } catch (error) {
            console.error("Error in ensureSystemUser:", error);
            throw error;
        }
    },

    /**
     * comparePassword - Compare provided password with hashed password
     */
    async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
};

module.exports = UserModel;
