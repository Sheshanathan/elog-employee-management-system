const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

const DEMO_ADMIN_EMAIL = "demo.admin@example.com";

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
            .select("_id email role isActive isDemo employee");

        if (!user) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        // Check User account
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been disabled"
            });
        }

        // Check Employee account
        if (user.role === "Employee" && user.employee) {
            const employee = await Employee.findById(user.employee);

            if (!employee) {
                return res.status(403).json({
                    message: "Employee profile not found"
                });
            }

            if (employee.status === "Inactive") {
                return res.status(403).json({
                    message:
                        "Your employee account is inactive. Please contact the administrator."
                });
            }
        }

        const isDemo = Boolean(user.isDemo) || (
            user.role === "Admin" &&
            user.email?.trim().toLowerCase() ===
                DEMO_ADMIN_EMAIL
        );

        req.user = {
            id: user._id,
            role: user.role,
            isActive: user.isActive,
            isDemo,
            employee: user.employee
        };

        const readOnlyMethods = new Set([
            "GET",
            "HEAD",
            "OPTIONS"
        ]);

        if (
            isDemo &&
            !readOnlyMethods.has(req.method)
        ) {
            return res.status(403).json({
                message:
                    "This is a read-only demo account. Changes are disabled."
            });
        }

        next();

    } catch (error) {
        console.error("Auth Error:", error);

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
