const UserModel = require("../models/user.model")
const AccountModel = require("../models/account.model")
const { sendWelcomeEmail, sendLoginEmail } = require("../services/email.service")
const jwt = require("jsonwebtoken")

/**
 * userRegisterController
 * post /api/auth/register 
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

        // Create a primary account for the new user automatically
        const account = await AccountModel.create({ userId: user.id })

        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.name).catch(console.error)

        const jwtSecret = process.env.JWT_SECRET || "development_secret_only"
        const token = jwt.sign({ userId: user.id }, jwtSecret, {
            expiresIn: "3d",
        })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })

        return res.status(201).json({
            status: "success",
            user: {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                status: user.status,
                accountId: account.id
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
 * userLoginController
 * post /api/auth/login 
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body
        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed",
            })
        }

        const isMatch = await UserModel.comparePassword(password, user.password)
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password",
                status: "failed",
            })
        }

        const jwtSecret = process.env.JWT_SECRET || "development_secret_only"
        const token = jwt.sign({ userId: user.id }, jwtSecret, {
            expiresIn: "3d",
        })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })

        // Send login email (non-blocking)
        sendLoginEmail(user.email, user.name).catch(console.error)

        return res.status(200).json({
            status: "success",
            user: {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email
            },
            token
        })

    } catch (error) {
        console.error("Login Controller Error:", error)
        return res.status(500).json({
            message: error.message,
            status: "failed",
        })
    }
}

/**
 * userLogoutController
 * post /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout Controller Error:", error);
        return res.status(500).json({
            message: error.message,
            status: "failed",
        });
    }
}

module.exports = { userRegisterController, userLoginController, userLogoutController }