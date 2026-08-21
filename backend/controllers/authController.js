const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");
const mongoose = require("mongoose");
const crypto = require("crypto");

async function login(req, res) {
    try {
        const {
            email,
            password
        } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) return res.status(403).json({ message: "This account is disabled" });

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            role: user.role,
            name: user.name
        });

    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            message: "Login failed"
        });
    }
}


async function forgotPassword(req, res) {
    try {
        const {
            email
        } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
    return res.status(200).json({
        message: "If an account exists with this email, a reset link has been sent"
    });
}

       const resetToken = crypto.randomBytes(32).toString("hex");

user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

user.passwordResetExpires = new Date(
    Date.now() + 15 * 60 * 1000
);

await user.save();

const resetLink =
    `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

       await transporter.sendMail({
    from: `"elog - Employee Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Reset Your Password",
    html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;">

            <div style="padding:40px 15px;">

                <div style="
                    max-width:600px;
                    margin:auto;
                    background:#ffffff;
                    border-radius:12px;
                    overflow:hidden;
                    box-shadow:0 4px 20px rgba(0,0,0,0.08);
                ">

                    <div style="
                        background:#5D2EE1;
                        padding:30px;
                        text-align:center;
                    ">
                        <img
                            src="${process.env.FRONTEND_URL}/elog-apple-touch.png"
                            alt="elog image"
                            width="65"
                            style="display:block;margin:0 auto 12px;"
                        >

                        <h1 style="
                            margin:0;
                            color:#FFBB5C;
                            font-size:24px;
                            font-weight:700;
                        ">
                            elog - Employee Management System
                        </h1>
                    </div>

                    <div style="padding:40px;">

                        <h2 style="
                            margin:0 0 15px;
                            color:#222222;
                        ">
                            Reset Your Password
                        </h2>

                        <p style="
                            color:#555555;
                            font-size:15px;
                            line-height:1.6;
                        ">
                            Hello ${user.name || "there"},
                        </p>

                        <p style="
                            color:#555555;
                            font-size:15px;
                            line-height:1.6;
                        ">
                            We received a request to reset the password
                            for your account. Click the button below to
                            create a new password.
                        </p>

                        <div style="text-align:center;margin:30px 0;">
                            <a
                                href="${resetLink}"
                                style="
                                    background:#5D2EE1;
                                    color:#FFBB5C;
                                    text-decoration:none;
                                    padding:14px 30px;
                                    border-radius:8px;
                                    font-weight:bold;
                                    display:inline-block;
                                "
                            >
                                Reset Password
                            </a>
                        </div>

                        <div style="
                            background:#FFF7E9;
                            border-left:4px solid #FFBB5C;
                            padding:12px 15px;
                            margin:20px 0;
                        ">
                            <p style="
                                margin:0;
                                color:#555555;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                This link will expire in
                                <strong>15 minutes</strong>.
                            </p>
                        </div>

                        <p style="
                            color:#777777;
                            font-size:13px;
                            line-height:1.6;
                        ">
                            If you did not request a password reset,
                            you can safely ignore this email.
                        </p>

                        <div style="
                            border-top:1px solid #eeeeee;
                            margin-top:25px;
                            padding-top:20px;
                        ">
                            <p style="
                                color:#999999;
                                font-size:11px;
                                line-height:1.5;
                                word-break:break-all;
                            ">
                                If the button doesn't work, use this link:
                                <br>
                                <span style="color:#5D2EE1;">
                                    ${resetLink}
                                </span>
                            </p>
                        </div>

                    </div>

                    <div style="
                        background:#f8f9fc;
                        padding:20px;
                        text-align:center;
                    ">
                        <p style="
                            margin:0;
                            color:#888888;
                            font-size:12px;
                        ">
                            © 2026 elog - Employee Management System.
                            All rights reserved.
                        </p>
                    </div>

                </div>

            </div>

        </body>
        </html>
    `
});
        res.status(200).json({
            message: "Reset Link Sent"
        });

    } catch (error) {
        console.error(
            "Forgot Password Error:",
            error
        );

        res.status(500).json({
            message: "Failed to send reset link"
        });
    }
}


async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Invalid reset link"
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                $gt: new Date()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset link"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        user.password = hashedPassword;

        // Invalidate the reset token immediately
        // so it cannot be used again.
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await user.save();

        return res.status(200).json({
            message: "Password Updated Successfully"
        });

    } catch (error) {
        console.error(
            "Reset Password Error:",
            error
        );

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach((field) => {
                errors[field] =
                    error.errors[field].message;
            });

            return res.status(400).json({
                message: "Validation failed",
                errors
            });
        }

        return res.status(500).json({
            message: "Failed to reset password"
        });
    }
}
async function validateResetToken(req, res) {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                message: "Invalid reset link. Please request a new reset link."
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                $gt: new Date()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset link. Please request a new reset link."
            });
        }

        return res.status(200).json({
            message: "Reset link is valid"
        });

    } catch (error) {
        console.error(
            "Validate Reset Token Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to validate reset link"
        });
    }
}

module.exports = {
    login,
    forgotPassword,
    resetPassword,
    validateResetToken
};
