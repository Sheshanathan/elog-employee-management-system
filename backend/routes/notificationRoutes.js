const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get my notifications
 *     description: Retrieve notifications for the currently logged-in user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 50
 *         description: Maximum number of notifications to return
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to retrieve notifications
 */
router.get(
    "/notifications",
    auth,
    notificationController.getMyNotifications
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     description: Retrieve the unread notification count for the currently logged-in user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to retrieve unread notification count
 */
router.get(
    "/notifications/unread-count",
    auth,
    notificationController.getUnreadCount
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Mark a single notification as read for the currently logged-in user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the notification
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Failed to mark notification as read
 */
router.patch(
    "/notifications/:id/read",
    auth,
    notificationController.markAsRead
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Mark all unread notifications as read for the currently logged-in user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to mark all notifications as read
 */
router.patch(
    "/notifications/read-all",
    auth,
    notificationController.markAllAsRead
);

module.exports = router;
