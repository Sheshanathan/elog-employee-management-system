const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: [true, "Employee is required"]
        },

        date: {
            type: Date,
            required: [true, "Attendance date is required"]
        },

        checkIn: {
            type: Date,
            default: null
        },

        checkOut: {
            type: Date,
            default: null
        },

        workingHours: {
            type: Number,
            default: 0,
            min: [0, "Working hours cannot be negative"]
        },

        status: {
            type: String,
            required: [true, "Attendance status is required"],
            enum: {
                values: ["Present", "Absent", "Leave"],
                message: "Status must be Present, Absent or Leave"
            }
        },

        remarks: {
            type: String,
            trim: true,
            maxlength: [
                200,
                "Remarks cannot exceed 200 characters"
            ]
        },

        originalCheckIn: {
            type: Date,
            default: null
        },

        originalCheckOut: {
            type: Date,
            default: null
        },

        timeEditCount: {
            type: Number,
            default: 0,
            min: [0, "Time edit count cannot be negative"],
            max: [3, "Maximum 3 time edits allowed per day"]
        },

        daySubmitted: {
            type: Boolean,
            default: false
        },

        submittedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

attendanceSchema.index(
    {
        employee: 1,
        date: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Attendance", attendanceSchema);