/**
 * authorize - Middleware to check user roles
 * @param {Array|String} roles - Allowed roles
 */
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
                status: "failed"
            });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: You do not have permission to perform this action",
                status: "failed"
            });
        }

        next();
    };
};

module.exports = { authorize };
