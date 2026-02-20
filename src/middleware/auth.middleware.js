const UserModel = require("../models/user.model")
const jwt = require("jsonwebtoken")

async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            status: "failed",
        })
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || "development_secret_only"
        const decoded = jwt.verify(token, jwtSecret)
        const user = await UserModel.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: "User not found",
                status: "failed",
            })
        }

        req.user = user
        return next()
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({
            message: "Unauthorized Access Token is Invalid",
            status: "failed",
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.systemToken || req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            status: "failed",
        })
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || "development_secret_only"
        const decoded = jwt.verify(token, jwtSecret)
        const user = await UserModel.findById(decoded.userId)

        if (!user || !user.is_system) {
            return res.status(403).json({
                message: "Forbidden: System access required",
                status: "failed",
            })
        }

        req.user = user
        return next()
    } catch (error) {
        console.error("System Auth error:", error);
        return res.status(401).json({
            message: "Unauthorized Access Token is Invalid",
            status: "failed",
        })
    }
}

module.exports = { authMiddleware, authSystemUserMiddleware }