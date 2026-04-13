const { verifyRegistrationResponse } = require("@simplewebauthn/server");

async function test() {
  try {
    const mockAttestation = {
        id: "mock_id",
        rawId: "mock_id",
        response: {
            clientDataJSON: "mock",
            attestationObject: "mock",
            transports: ["internal"]
        },
        type: "public-key",
        clientExtensionResults: {},
        authenticatorAttachment: "platform",
        name: "My Setup" // extra field!
    };

    await verifyRegistrationResponse({
      response: mockAttestation,
      expectedChallenge: "mock_challenge",
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost"
    });
  } catch(e) {
    console.error("SimpleWebAuthn Error:", e.message);
  }
}
test();
