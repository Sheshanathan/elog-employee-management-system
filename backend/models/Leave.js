const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        leaveType: {
            type: String,
            enum: [
                "Casual Leave",
                "Sick Leave",
                "Earned Leave",
                "Unpaid Leave",
                "Optional Holiday"
            ],
            required: true
        },

        fromDate: {
            type: Date,
            required: true
        },

        toDate: {
            type: Date,
            required: true
        },

        days: {
            type: Number,
            required: true,
            min: 0.5
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
                "Cancelled"
            ],
            default: "Pending"
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        approvedAt: {
            type: Date,
            default: null
        },

        rejectionReason: {
            type: String,
            default: null
        },

        adminRemark: {
            type: String,
            default: null,
            trim: true,
            maxlength: 500
        },

        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Leave", leaveSchema);