const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        type: {
            type: String,
            default: "info",
            index: true
        },
        relatedEntityType: {
            type: String,
            default: null,
            trim: true
        },
        relatedEntityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
