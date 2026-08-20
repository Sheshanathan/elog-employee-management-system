const mongoose = require("mongoose");
const Notification = require("../models/Notification");

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

exports.getMyNotifications = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        const notifications = await Notification.find({
            recipient: req.user.id
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        return res.status(500).json({
            message: "Failed to retrieve notifications"
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        return res.status(200).json({ count });
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        return res.status(500).json({
            message: "Failed to retrieve unread notification count"
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json(notification);
    } catch (error) {
        console.error("Mark Notification Read Error:", error);
        return res.status(500).json({
            message: "Failed to mark notification as read"
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Mark All Notifications Read Error:", error);
        return res.status(500).json({
            message: "Failed to mark all notifications as read"
        });
    }
};
