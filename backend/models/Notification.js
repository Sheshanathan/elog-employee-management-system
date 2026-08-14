const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, default: "info" },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model("Notification", schema);
