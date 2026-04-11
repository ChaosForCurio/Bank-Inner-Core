const { sql } = require("../db");
const bcrypt = require("bcryptjs");

const UserModel = {
    /**
     * findOne - Find a user by query (supported: email, id, uuid)
     */
    async findOne({ email, id, uuid }) {
        try {
            let user;
            if (email) {
                const users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
                user = users[0];
            } else if (id) {
                const users = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
                user = users[0];
            } else if (uuid) {
                const users = await sql`SELECT * FROM users WHERE uuid = ${uuid} LIMIT 1`;
                user = users[0];
            }
            return user || null;
        } catch (error) {
            console.error("Error in UserModel.findOne:", error);
            throw error;
        }
    },

    /**
     * findById - Find a user by ID
     */
    async findById(id) {
        return this.findOne({ id });
    },

    /**
     * findByUuid - Find a user by UUID
     */
    async findByUuid(uuid) {
        return this.findOne({ uuid });
    },

    /**
     * create - Create a new user with security defaults
     */
    async create({ email, password, name, role = 'user', isSystem = false }) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const status = 'active';

            const users = await sql`
                INSERT INTO users (email, password, name, status, role, is_system)
                VALUES (${email}, ${hashedPassword}, ${name}, ${status}, ${role}, ${isSystem})
                RETURNING id, uuid, email, name, status, role, is_system, created_at, password
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
     * updateSecurityInfo - Update security related fields
     */
    async updateSecurityInfo(userId, updates) {
        try {
            // Since the Neon driver doesn't support easy dynamic queries like postgres.js,
            // and we only have a few security fields, we'll handle common ones or just do one-off updates.
            // For now, let's implement the specific logic for each field we need.
            
            if (updates.failed_login_attempts !== undefined) {
                await sql`UPDATE users SET failed_login_attempts = ${updates.failed_login_attempts} WHERE id = ${userId}`;
            }
            if (updates.lockout_until !== undefined) {
                await sql`UPDATE users SET lockout_until = ${updates.lockout_until} WHERE id = ${userId}`;
            }
            if (updates.last_login !== undefined) {
                await sql`UPDATE users SET last_login = ${updates.last_login} WHERE id = ${userId}`;
            }
            if (updates.mfa_enabled !== undefined) {
                await sql`UPDATE users SET mfa_enabled = ${updates.mfa_enabled} WHERE id = ${userId}`;
            }
            if (updates.mfa_secret !== undefined) {
                await sql`UPDATE users SET mfa_secret = ${updates.mfa_secret} WHERE id = ${userId}`;
            }
            if (updates.webauthn_challenge !== undefined) {
                await sql`UPDATE users SET webauthn_challenge = ${updates.webauthn_challenge} WHERE id = ${userId}`;
            }
        } catch (error) {
            console.error("Error in UserModel.updateSecurityInfo:", error);
            throw error;
        }
    },

    /**
     * incrementFailedLogin - Increment failed login count and lockout if threshold reached
     */
    async incrementFailedLogin(user) {
        const MAX_ATTEMPTS = 5;
        const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
        
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        const updates = { failed_login_attempts: newAttempts };
        
        if (newAttempts >= MAX_ATTEMPTS) {
            updates.lockout_until = new Date(Date.now() + LOCKOUT_DURATION);
        }
        
        await this.updateSecurityInfo(user.id, updates);
        return updates;
    },

    /**
     * resetFailedLogin - Reset failed login count
     */
    async resetFailedLogin(userId) {
        await this.updateSecurityInfo(userId, {
            failed_login_attempts: 0,
            lockout_until: null
        });
    },

    /**
     * updateLastLogin - Update last login timestamp
     */
    async updateLastLogin(userId) {
        await this.updateSecurityInfo(userId, {
            last_login: new Date()
        });
    },

    /**
     * ensureSystemUser - Legacy helper, updated for role-based logic
     */
    async ensureSystemUser() {
        try {
            const systemEmail = "system@bank.com";
            let systemUser = await this.findOne({ email: systemEmail });

            if (!systemUser) {
                console.log("Creating system user...");
                systemUser = await this.create({
                    email: systemEmail,
                    password: process.env.SYSTEM_USER_PASSWORD || "system_internal_secure_password_fixed",
                    name: "System",
                    role: 'admin',
                    isSystem: true
                });
            }

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
    },

    /**
     * findById - Find user by primary key
     */
    async findById(id) {
        try {
            const result = await sql`
                SELECT * FROM users WHERE id = ${id} LIMIT 1
            `;
            return result[0];
        } catch (error) {
            console.error("Error in UserModel.findById:", error);
            throw error;
        }
    },

    /**
     * updateSecurityInfo - Update security-related fields for a user
     */
    async updateSecurityInfo(userId, updates) {
        try {
            // Filter out fields that doesn't exist to prevent errors (basic check)
            const allowedFields = [
                'failed_login_attempts', 
                'lockout_until', 
                'last_login', 
                'mfa_enabled', 
                'mfa_secret', 
                'webauthn_challenge'
            ];
            
            const sets = Object.entries(updates)
                .filter(([key]) => allowedFields.includes(key))
                .map(([key, value]) => sql`${sql(key)} = ${value}`);

            if (sets.length === 0) return;

            await sql`
                UPDATE users 
                SET ${sql(sets)}
                WHERE id = ${userId}
            `;
        } catch (error) {
            console.error("Error in updateSecurityInfo:", error);
            throw error;
        }
    }
};

module.exports = UserModel;
