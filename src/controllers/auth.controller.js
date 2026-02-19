const UserModel = require("../models/user.model")
const LoginHistoryModel = require("../models/loginHistory.model")
const { sendWelcomeEmail, sendLoginEmail } = require("../services/email.service")

const jwt = require("jsonwebtoken")

/**
 * - user register controller
 * - post /api/auth/register 
 */

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body
        const userExist = await UserModel.findOne({ email })
        if (userExist) {
            return res.status(422).json({
                message: "User already exists",
                status: "failed",
            })
        }
        const user = await UserModel.create({ email, password, name })

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name)

        // Ensure JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET || "development_secret_only"

        const token = jwt.sign({ id: user._id }, jwtSecret, {
            expiresIn: "3d",
        })
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
        return res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                status: user.status
            },
            token
        })



    } catch (error) {
        console.error("Registration Controller Error:", error)
        return res.status(500).json({
            message: error.message,
            status: "failed",
        })
    }
}

/**
 * - user registar controller
 * - post /api/auth/register 
 */

async function userLoginController(req, res) {
    try {
        const { email, password } = req.body
        const user = await UserModel.findOne({ email }).select("+password")
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed",
            })
        }
        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
                status: "failed",
            })
        }

        user.comparePassword(password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to compare password",
                    status: "failed",
                })
            }
            if (!isMatch) {
                return res.status(401).json({
                    message: "Invalid password",
                    status: "failed",
                })
            }
            const jwtSecret = process.env.JWT_SECRET || "development_secret_only"
            const token = jwt.sign({ id: user._id }, jwtSecret, {
                expiresIn: "3d",
            })
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            })

            // Send login email
            sendLoginEmail(user.email, user.name)

            // Save login history
            const ipAddress = req.ip || req.connection.remoteAddress;
            LoginHistoryModel.create({ userId: user._id, ipAddress }).catch(err => console.error("Error saving login history:", err));

            return res.status(200).json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            })
        })
    } catch (error) {
        console.error("Login Controller Error:", error)
        return res.status(500).json({
            message: error.message,
            status: "failed",
        })
    }
}

module.exports = { userRegisterController, userLoginController }