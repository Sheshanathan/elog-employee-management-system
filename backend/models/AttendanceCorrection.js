const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    attendanceDate: { type: Date, required: true },
    requestedCheckIn: { type: Date, default: null },
    requestedCheckOut: { type: Date, default: null },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
    adminRemarks: { type: String, trim: true, maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });
schema.index({ employee: 1, attendanceDate: 1, status: 1 });
module.exports = mongoose.model("AttendanceCorrection", schema);
