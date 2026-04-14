const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const requestIdMiddleware = require("./middleware/request-id.middleware")
const env = require("./config/env.config")
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes")
const userRouter = require("./routes/user.route")
const beneficiaryRouter = require("./routes/beneficiary.routes")
const scheduledTransferRouter = require("./routes/scheduledTransfer.routes")
const notificationRouter = require("./routes/notification.routes")
const adminRouter = require("./routes/admin.routes")
const { sql } = require("./db")

const app = express()

// Configure Helmet with cross-origin allowed for the banking API
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}))

// Request correlation
app.use(requestIdMiddleware)

// Standardize Logging with Morgan
morgan.token('request-id', (req) => req.id)
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - RequestID: :request-id'))

const allowedOrigins = [
    env.ORIGIN,
    "https://bank-inner-core-4s7p.vercel.app"
].filter(Boolean).map(o => o.replace(/\/$/, ""));

app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in development
        if (!origin || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");
        const isVercelPreview = normalizedOrigin.startsWith('https://bank-inner-core-') && normalizedOrigin.endsWith('.vercel.app');
        const isAllowed = allowedOrigins.includes(normalizedOrigin) || isVercelPreview;

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-Request-Id"]
}))

// Removed manual logging in favor of morgan

app.use(cookieParser())
app.use(express.json())

// Health Check
app.get("/api/health", async (req, res) => {
    try {
        await sql`SELECT 1`;
        res.json({
            success: true,
            message: "Backend is healthy",
            database: "connected",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: "Backend unhealthy",
            database: "disconnected",
            error: error.message
        });
    }
});

// Routes
app.use("/api/auth", authRouter)
app.use("/api/account", accountRouter)
app.use("/api/transaction", transactionRouter)
app.use("/api/users", userRouter)
app.use("/api/beneficiaries", beneficiaryRouter)
app.use("/api/scheduled-transfers", scheduledTransferRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/admin", adminRouter)

// 404 Handler
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
    const requestId = req.id || "unknown";
    console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error: ${req.method} ${req.originalUrl}`, err);

    // Standardize error types
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = undefined;

    // Handle Zod Validation Errors
    if (err.name === 'ZodError') {
        statusCode = 400;
        message = "Validation Error";
        errors = err.errors;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        errors: errors,
        requestId: requestId,
        // Include stack trace only in development
        stack: env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app
