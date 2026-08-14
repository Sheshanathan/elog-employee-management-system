const mongoose = require("mongoose");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");
const audit = require("../utils/audit");
const { EMPLOYEE_NESTED_POPULATE } = require("../utils/employeeHelpers");

async function linkedEmployee(userId) {
    const user = await User.findById(userId).select("role employee isActive");
    if (!user) return { error: [404, "User Not Found"] };
    if (!user.isActive) return { error: [403, "This account is disabled"] };
    if (user.role !== "Employee") return { error: [403, "Employee access required"] };
    if (!user.employee) return { error: [400, "No employee profile is linked to this account"] };
    return { user, employee: user.employee };
}

exports.apply = async (req, res) => {
    try {
        const link = await linkedEmployee(req.user.id);
        if (link.error) return res.status(link.error[0]).json({ message: link.error[1] });
        const { leaveType, startDate, endDate, reason } = req.body;
        const start = new Date(startDate); const end = new Date(endDate);
        if (!leaveType || !reason?.trim() || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
            return res.status(400).json({ message: "Provide a leave type, valid date range and reason" });
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
        const overlap = await LeaveRequest.exists({ employee: link.employee, status: { $in: ["Pending", "Approved"] }, startDate: { $lte: end }, endDate: { $gte: start } });
        if (overlap) return res.status(409).json({ message: "An overlapping leave request already exists" });
        const leave = await LeaveRequest.create({ employee: link.employee, leaveType, startDate: start, endDate: end, reason: reason.trim() });
        const admins = await User.find({ role: "Admin", isActive: true }).select("_id");
        await Notification.insertMany(admins.map(({ _id }) => ({ recipient: _id, title: "New leave request", message: "A leave request needs review.", type: "leave" })), { ordered: false }).catch(() => {});
        res.status(201).json({ message: "Leave request submitted", leave });
    } catch (error) { res.status(500).json({ message: "Failed to submit leave request" }); }
};
exports.my = async (req, res) => { try { const link = await linkedEmployee(req.user.id); if (link.error) return res.status(link.error[0]).json({ message: link.error[1] }); res.json(await LeaveRequest.find({ employee: link.employee }).sort({ createdAt: -1 })); } catch { res.status(500).json({ message: "Failed to retrieve leave requests" }); } };
exports.list = async (req, res) => { try { const filter = req.query.status ? { status: req.query.status } : {}; res.json(await LeaveRequest.find(filter).populate(EMPLOYEE_NESTED_POPULATE).populate("reviewedBy", "name").sort({ createdAt: -1 })); } catch { res.status(500).json({ message: "Failed to retrieve leave requests" }); } };
exports.review = async (req, res) => { try { const { status, adminRemarks = "" } = req.body; if (!mongoose.Types.ObjectId.isValid(req.params.id) || !["Approved", "Rejected"].includes(status)) return res.status(400).json({ message: "Provide a valid request ID and review status" }); const leave = await LeaveRequest.findById(req.params.id); if (!leave) return res.status(404).json({ message: "Leave request not found" }); if (leave.status !== "Pending") return res.status(409).json({ message: "This leave request has already been reviewed" }); const oldValue = { status: leave.status }; leave.status = status; leave.adminRemarks = adminRemarks; leave.reviewedBy = req.user.id; await leave.save(); const employeeUser = await User.findOne({ employee: leave.employee, role: "Employee" }); if (employeeUser) await Notification.create({ recipient: employeeUser._id, title: `Leave ${status.toLowerCase()}`, message: adminRemarks || `Your leave request was ${status.toLowerCase()}.`, type: "leave" }); await audit(req.user.id, `LEAVE_${status.toUpperCase()}`, "LeaveRequest", leave._id, oldValue, { status, adminRemarks }); res.json({ message: `Leave request ${status.toLowerCase()}`, leave }); } catch { res.status(500).json({ message: "Failed to review leave request" }); } };
