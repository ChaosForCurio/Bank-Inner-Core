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
     * create - Create a new user
     */
    async create({ email, password, name }) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            const users = await sql`
        INSERT INTO users (email, password, name)
        VALUES (${email}, ${hashedPassword}, ${name})
        RETURNING id, email, name, created_at
      `;

            // Map 'id' to '_id' to match expected controller behavior
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
     * comparePassword - Compare provided password with hashed password
     */
    async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
};

module.exports = UserModel;
