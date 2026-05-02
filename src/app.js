const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const compression = require("compression")
const Sentry = require("@sentry/node")
const { nodeProfilingIntegration } = require("@sentry/profiling-node")
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
const exchangeRouter = require("./routes/exchange.routes")
const virtualCardRouter = require("./routes/virtualCard.routes")
const paymentRequestRouter = require("./routes/paymentRequest.routes")
const analyticsRouter = require("./routes/analytics.routes")
const vaultRouter = require("./routes/vault.routes")
const externalAccountRouter = require("./routes/externalAccount.routes")
const webhookRouter = require("./routes/webhook.routes")
const proofRouter = require("./routes/proof.routes")
const { apiRateLimiter } = require("./middleware/rate-limit.middleware")
const { sql } = require("./db")
const swaggerUi = require("swagger-ui-express")
const swaggerSpecs = require("./config/swagger.config")

const app = express()

// Initialize Sentry before any other middleware
if (env.SENTRY_DSN) {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
        environment: env.NODE_ENV
    });
    
    // The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
}

// Performance & Security
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}))
app.use(compression()) // Compress all responses
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

// Apply global API rate limit
app.use("/api", apiRateLimiter)

// Routes
app.use("/api/auth", authRouter)
app.use("/api/account", accountRouter)
app.use("/api/transaction", transactionRouter)
app.use("/api/users", userRouter)
app.use("/api/beneficiaries", beneficiaryRouter)
app.use("/api/scheduled-transfers", scheduledTransferRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/admin", adminRouter)
app.use("/api/exchange", exchangeRouter)
app.use("/api/virtual-cards", virtualCardRouter)
app.use("/api/payment-requests", paymentRequestRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/vaults", vaultRouter)
app.use("/api/external-accounts", externalAccountRouter)
app.use("/api/webhooks", webhookRouter)
app.use("/api/proof", proofRouter)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

// 404 Handler
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Global Error Handler
if (env.SENTRY_DSN) {
    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());
}

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
