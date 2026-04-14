const PasskeyModel = require("../models/passkey.model");
const UserModel = require("../models/user.model");
const AuditModel = require("../models/audit.model");
const { generateResetToken } = require("../utils/token.util");

const rpName = "Xieriee Bank";

/**
 * Robust helper to determine RP ID and Origin dynamically.
 * This handles local dev, production, and Vercel preview environments automatically.
 */
const getWebAuthnConfig = (req) => {
    // 1. Check for manual overrides in environment variables
    const manualRpID = process.env.RP_ID;
    const manualOrigin = process.env.ORIGIN;

    // 2. Identify incoming request's origin
    const reqOrigin = req.headers.origin 
        || (req.headers.referer ? new URL(req.headers.referer).origin : null);

    if (reqOrigin) {
        try {
            const url = new URL(reqOrigin);
            const hostname = url.hostname;

            // If it's a Vercel preview or branch deployment, use its domain as the RP ID
            if (hostname.endsWith('.vercel.app')) {
                return { 
                    rpID: manualRpID || hostname, 
                    origin: manualOrigin || reqOrigin 
                };
            }
        } catch (e) {
            // Fallback
        }
    }

    // 3. Final Fallback (Production or Localhost)
    const rpID = manualRpID || "localhost";
    const origin = manualOrigin || (rpID === "localhost" ? "http://localhost:3000" : `https://${rpID}`);
    
    return { rpID, origin };
};

/**
 * Controller for Passkey (WebAuthn) Management
 */
const PasskeyController = {
    /**
     * generateRegistrationOptions - Start the passkey registration flow
     */
    async generateRegistrationOptions(req, res) {
        try {
            // Dynamically import @simplewebauthn/server (ESM)
            const { generateRegistrationOptions } = await import("@simplewebauthn/server");
            
            const user = await UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const userPasskeys = await PasskeyModel.listActiveForUser(user.id);
            const { rpID } = getWebAuthnConfig(req);

            const options = await generateRegistrationOptions({
                rpName,
                rpID,
                userID: new Uint8Array(Buffer.from(user.uuid || user.id.toString())),
                userName: user.email,
                userDisplayName: user.name,
                attestationType: "none",
                excludeCredentials: userPasskeys.map(pk => ({
                    id: pk.credential_id,
                    type: "public-key",
                    transports: pk.transports,
                })),
                authenticatorSelection: {
                    residentKey: "preferred",
                    userVerification: "preferred",
                    authenticatorAttachment: "platform", // Preferred for Passkeys (on-device)
                },
            });

            // Store challenge in DB temporarily
            await UserModel.updateSecurityInfo(user.id, {
                webauthn_challenge: options.challenge
            });

            res.json(options);
        } catch (error) {
            console.error("Error in generateRegistrationOptions:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    /**
     * verifyRegistration - Complete the passkey registration flow
     */
    async verifyRegistration(req, res) {
        try {
            const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
            const { body } = req;
            
            const user = await UserModel.findById(req.user.id);
            if (!user || !user.webauthn_challenge) {
                return res.status(400).json({ success: false, message: "Invalid registration session" });
            }

            const expectedChallenge = user.webauthn_challenge;
            const { rpID, origin } = getWebAuthnConfig(req);

            const verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
            });

            const { verified, registrationInfo } = verification;

            if (verified && registrationInfo) {
                const { credential } = registrationInfo;
                const { publicKey, counter } = credential;

                // Save passkey
                await PasskeyModel.create({
                    userId: user.id,
                    credentialId: body.id, // The ID from browser
                    publicKey: Buffer.from(publicKey),
                    counter,
                    transports: body.response.transports || credential.transports || [],
                    name: req.body.name || "Default Device"
                });

                // Clear challenge
                await UserModel.updateSecurityInfo(user.id, {
                    webauthn_challenge: null,
                    mfa_enabled: true // Enabling passkeys counts as MFA enrollment
                });

                // Audit Log
                await AuditModel.create({
                    user_id: user.id,
                    action: "PASSKEY_REGISTERED",
                    status: "success",
                    ip_address: req.ip,
                    user_agent: req.headers["user-agent"],
                    metadata: { credentialId: body.id }
                });

                return res.json({ success: true, message: "Passkey registered successfully" });
            }

            res.status(400).json({ success: false, message: "Verification failed" });
        } catch (error) {
            console.error("Error in verifyRegistration:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    /**
     * listPasskeys - List all registered passkeys for current user
     */
    async listPasskeys(req, res) {
        try {
            const passkeys = await PasskeyModel.listActiveForUser(req.user.id);
            res.json(passkeys);
        } catch (error) {
            console.error("Error in listPasskeys:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    /**
     * deletePasskey - Remove a passkey
     */
    async deletePasskey(req, res) {
        try {
            const { id } = req.params;
            // Ensure passkey belongs to user (not efficient but safe if we had findOneById)
            const passkeys = await PasskeyModel.listActiveForUser(req.user.id);
            const exists = passkeys.find(pk => pk.id === parseInt(id));
            
            if (!exists) {
                return res.status(404).json({ success: false, message: "Passkey not found" });
            }

            await PasskeyModel.delete(id);

            // Audit Log
            await AuditModel.create({
                user_id: req.user.id,
                action: "PASSKEY_REMOVED",
                status: "success",
                ip_address: req.ip,
                user_agent: req.headers["user-agent"],
                metadata: { passkeyId: id }
            });

            res.json({ success: true, message: "Passkey removed successfully" });
        } catch (error) {
            console.error("Error in deletePasskey:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    /**
     * generateLoginOptions - Start the passkey authentication flow (for password reset)
     */
    async generateLoginOptions(req, res) {
        try {
            const { generateAuthenticationOptions } = await import("@simplewebauthn/server");

            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: "Email is required" });
            }

            // Find user — return generic message to prevent email enumeration
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: "No account with passkeys found for this email" });
            }

            const userPasskeys = await PasskeyModel.listActiveForUser(user.id);
            if (userPasskeys.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "No passkeys registered for this account. Please contact support to reset your password." 
                });
            }

            const { rpID } = getWebAuthnConfig(req);

            const options = await generateAuthenticationOptions({
                rpID,
                userVerification: "preferred",
                allowCredentials: userPasskeys.map(pk => ({
                    id: pk.credential_id,
                    type: "public-key",
                    transports: pk.transports,
                })),
            });

            // Store challenge
            await UserModel.updateSecurityInfo(user.id, {
                webauthn_challenge: options.challenge
            });

            res.json({ ...options, userId: user.id, userName: user.name });
        } catch (error) {
            console.error("Error in generateLoginOptions:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    /**
     * verifyLogin - Verify passkey authentication and return a short-lived reset token
     */
    async verifyLogin(req, res) {
        try {
            const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
            const { body } = req;

            const { email, userId: bodyUserId } = body;
            if (!email) {
                return res.status(400).json({ success: false, message: "Email is required" });
            }

            const user = await UserModel.findOne({ email });
            if (!user || !user.webauthn_challenge) {
                return res.status(400).json({ success: false, message: "Invalid authentication session" });
            }

            const credentialId = body.id;
            const passkey = await PasskeyModel.findByCredentialId(credentialId);
            if (!passkey || passkey.user_id !== user.id) {
                return res.status(400).json({ success: false, message: "Passkey not found for this account" });
            }

            const { rpID, origin } = getWebAuthnConfig(req);

            const verification = await verifyAuthenticationResponse({
                response: body,
                expectedChallenge: user.webauthn_challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: passkey.credential_id,
                    publicKey: passkey.public_key,
                    counter: passkey.counter,
                    transports: passkey.transports,
                },
            });

            const { verified, authenticationInfo } = verification;

            if (!verified) {
                return res.status(400).json({ success: false, message: "Passkey verification failed" });
            }

            // Update counter to prevent replay attacks
            await PasskeyModel.updateCounter(credentialId, authenticationInfo.newCounter);

            // Clear challenge
            await UserModel.updateSecurityInfo(user.id, { webauthn_challenge: null });

            // Generate a short-lived reset token (10 min)
            const resetToken = generateResetToken(user.id);

            await AuditModel.create({
                user_id: user.id,
                action: "PASSKEY_AUTH_FOR_RESET",
                status: "success",
                ip_address: req.ip,
                user_agent: req.headers["user-agent"],
            });

            res.json({ success: true, resetToken });
        } catch (error) {
            console.error("Error in verifyLogin:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

};

module.exports = PasskeyController;
