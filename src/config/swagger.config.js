const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Bank Inner Core API",
            version: "1.0.0",
            description: "A secure, robust banking core API with support for accounts, transactions, vaults, and virtual cards.",
            contact: {
                name: "API Support",
                url: "https://github.com/ChaosForCurio/Bank-Inner-Core",
            },
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
