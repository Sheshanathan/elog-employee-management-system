const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("_id role isActive");

        if (!user) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been disabled"
            });
        }

        req.user = {
            id: user._id,
            role: user.role,
            isActive: user.isActive
        };

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired"
            });
        }

        return res.status(401).json({
            message: "Token expired or invalid"
        });
    }
}

module.exports = auth;