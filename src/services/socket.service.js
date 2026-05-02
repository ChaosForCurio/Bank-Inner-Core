const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env.config");

let io;

const SocketService = {
    init(server) {
        io = new Server(server, {
            cors: {
                origin: [env.ORIGIN, "https://bank-inner-core-4s7p.vercel.app"].filter(Boolean),
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Authentication Middleware for Socket.io
        io.use((socket, next) => {
            try {
                // Get token from cookie or header
                const cookieStr = socket.handshake.headers.cookie;
                let token;

                if (cookieStr) {
                    const cookies = Object.fromEntries(cookieStr.split('; ').map(c => c.split('=')));
                    token = cookies.auth_token;
                }

                if (!token && socket.handshake.auth) {
                    token = socket.handshake.auth.token;
                }

                if (!token) {
                    return next(new Error("Authentication error: No token provided"));
                }

                const decoded = jwt.verify(token, env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                console.error("Socket Auth Error:", err.message);
                next(new Error("Authentication error: Invalid token"));
            }
        });

        io.on("connection", (socket) => {
            const userId = socket.user.id;
            console.log(`User connected to socket: ${userId} (${socket.id})`);

            // Join a private room for this user
            socket.join(`user_${userId}`);

            socket.on("disconnect", () => {
                console.log(`User disconnected from socket: ${userId}`);
            });
        });

        return io;
    },

    /**
     * emitToUser - Sends an event to all connected sockets of a specific user
     */
    emitToUser(userId, event, data) {
        if (!io) {
            console.warn("Socket.io not initialized. Cannot emit event.");
            return;
        }
        io.to(`user_${userId}`).emit(event, data);
    },

    /**
     * emitToAccount - (Optional) Sends an event to anyone monitoring a specific account
     */
    emitToAccount(accountId, event, data) {
        if (!io) return;
        io.to(`account_${accountId}`).emit(event, data);
    }
};

module.exports = SocketService;
