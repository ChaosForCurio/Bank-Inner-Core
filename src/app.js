const express = require("express")
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.routes")

const app = express()

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

app.use(cookieParser())
app.use(express.json())

//** Routes Required*/

const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")

//** Use Routes */

app.use("/api/auth", authRouter)
app.use("/api/account", accountRouter)

module.exports = app