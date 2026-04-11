const PasskeyModel = require("../models/passkey.model");
const UserModel = require("../models/user.model");
const AuditModel = require("../models/audit.model");

// RP (Relying Party) settings
const rpName = "Xieriee Bank";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || `http://${rpID}:3000`;

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

            const options = await generateRegistrationOptions({
                rpName,
                rpID,
                userID: user.id.toString(),
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

            const verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
            });

            const { verified, registrationInfo } = verification;

            if (verified && registrationInfo) {
                const { credentialPublicKey, credentialID, counter } = registrationInfo;

                // Save passkey
                await PasskeyModel.create({
                    userId: user.id,
                    credentialId: body.id, // The ID from browser
                    publicKey: Buffer.from(credentialPublicKey),
                    counter,
                    transports: body.response.transports || [],
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
    }
};

module.exports = PasskeyController;
