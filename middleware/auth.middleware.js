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
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await UserModel.findById(decoded.userId)
        req.user = user
        return next()
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized Access Token is Invalid",
            status: "failed",
        })
    }
}


module.exports = { authMiddleware }