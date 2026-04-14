const { z } = require("zod");
const dotenv = require("dotenv");

// Load the environment variables
dotenv.config();

/**
 * Environment variable schema
 * Ensures all required variables are present and correctly formatted
 */
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("5000"),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(16, "JWT_SECRET should be at least 16 characters for security"),
    
    // Auth configuration
    RP_ID: z.string().default("localhost"),
    RP_NAME: z.string().default("Bank Inner Core"),
    ORIGIN: z.string().url().optional(), // Can be dynamic in app.js, but validated here if static

    // Email configuration (Optional/Required based on features)
    MAILGUN_API_KEY: z.string().optional(),
    MAILGUN_DOMAIN: z.string().optional(),
    MAILGUN_SENDER: z.string().optional(),

    // Web Push configuration
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
});

/**
 * Validate environment variables
 * Throws a detailed error and shuts down if validation fails
 */
function validateEnv() {
    try {
        const env = envSchema.parse(process.env);
        return env;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("\x1b[31m%s\x1b[0m", "❌ Invalid environment variables:");
            error.errors.forEach((err) => {
                console.error("\x1b[31m%s\x1b[0m", `  - ${err.path.join(".")}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}

const env = validateEnv();

module.exports = env;
