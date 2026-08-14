const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

const {
    validateUserData,
    validateLogin,
    validateForgotPassword,
    validateResetPassword
} = require("../middleware/validation");


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login Successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *                 role:
 *                   type: string
 *                   example: Admin
 *                 name:
 *                   type: string
 *                   example: John Doe
 *       400:
 *         description: Invalid password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post(
    "/login",
    validateLogin,
    authController.login
);


/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *       400:
 *         description: Invalid email
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to send reset email
 */
router.post(
    "/forgot-password",
    validateForgotPassword,
    authController.forgotPassword
);


/**
 * @swagger
 * /reset-password/{token}:
 *   post:
 *     summary: Reset user password
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Invalid or expired reset token
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to reset password
 */
router.post(
    "/reset-password/:token",
    validateResetPassword,
    authController.resetPassword
);

/**
 * @swagger
 * /validate-reset-token/{token}:
 *   get:
 *     summary: Validate password reset token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token received in the reset link
 *     responses:
 *       200:
 *         description: Reset link is valid
 *       400:
 *         description: Invalid or expired reset link
 *       404:
 *         description: User associated with the reset token was not found
 */
router.get(
    "/validate-reset-token/:token",
    authController.validateResetToken
);

module.exports = router;
