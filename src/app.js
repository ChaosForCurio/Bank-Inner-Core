const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes")

const app = express()

// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

app.use(cookieParser())
app.use(express.json())

// Routes
app.use("/api/auth", authRouter)
app.use("/api/account", accountRouter)
app.use("/api/transaction", transactionRouter)

module.exports = app