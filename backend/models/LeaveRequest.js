const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveType: { type: String, enum: ["Annual", "Sick", "Casual", "Unpaid", "Other"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected", "Cancelled"], default: "Pending", index: true },
    adminRemarks: { type: String, trim: true, maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

leaveRequestSchema.index({ employee: 1, startDate: 1, endDate: 1 });
module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
