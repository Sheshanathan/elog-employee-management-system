const Notification = require("../models/Notification");
const User = require("../models/User");

const LEAVE_NOTIFICATION_TYPES = [
    "LEAVE_APPLIED",
    "LEAVE_APPROVED",
    "LEAVE_REJECTED",
    "LEAVE_CANCELLED",
    "LEAVE_WITHDRAWN",
    "LEAVE_ACTION_REQUIRED"
];

function formatLeaveDate(date) {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

async function getActiveAdminIds() {
    const admins = await User.find({ role: "Admin", isActive: true }).select("_id");
    return admins.map((admin) => admin._id);
}

async function getEmployeeUserId(employeeId) {
    const user = await User.findOne({
        employee: employeeId,
        role: "Employee",
        isActive: true
    }).select("_id");

    return user ? user._id : null;
}

async function createNotification({
    recipientId,
    title,
    message,
    type,
    relatedEntityType = "Leave",
    relatedEntityId = null
}) {
    if (!recipientId) {
        return null;
    }

    return Notification.create({
        recipient: recipientId,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId
    });
}

async function notifyActiveAdmins({ title, message, type, leaveId }) {
    const adminIds = await getActiveAdminIds();

    if (adminIds.length === 0) {
        return [];
    }

    const payload = adminIds.map((recipientId) => ({
        recipient: recipientId,
        title,
        message,
        type,
        relatedEntityType: "Leave",
        relatedEntityId: leaveId
    }));

    return Notification.insertMany(payload, { ordered: false }).catch(() => []);
}

async function notifyEmployeeUser(employeeId, { title, message, type, leaveId }) {
    const recipientId = await getEmployeeUserId(employeeId);

    return createNotification({
        recipientId,
        title,
        message,
        type,
        relatedEntityId: leaveId
    });
}

async function notifyLeaveApplied(leave, employeeName) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    await Promise.all([
        notifyActiveAdmins({
            title: "New leave request",
            message: `New leave request submitted by ${employeeName}.`,
            type: "LEAVE_APPLIED",
            leaveId: leave._id
        }),
        notifyEmployeeUser(leave.employee, {
            title: "Leave submitted",
            message: `Your leave request from ${fromDate} to ${toDate} has been submitted and is pending approval.`,
            type: "LEAVE_APPLIED",
            leaveId: leave._id
        })
    ]);
}

async function notifyLeaveApproved(leave) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);
    const remarkSuffix = leave.adminRemark ? ` Remark: ${leave.adminRemark}` : "";

    await notifyEmployeeUser(leave.employee, {
        title: "Leave approved",
        message: `Your leave request from ${fromDate} to ${toDate} has been approved.${remarkSuffix}`,
        type: "LEAVE_APPROVED",
        leaveId: leave._id
    });
}

async function notifyLeaveRejected(leave) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);
    const remarkSuffix = leave.rejectionReason ? ` Remark: ${leave.rejectionReason}` : "";

    await notifyEmployeeUser(leave.employee, {
        title: "Leave rejected",
        message: `Your leave request from ${fromDate} to ${toDate} has been rejected.${remarkSuffix}`,
        type: "LEAVE_REJECTED",
        leaveId: leave._id
    });
}

async function notifyLeaveWithdrawn(leave, employeeName) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    await Promise.all([
        notifyActiveAdmins({
            title: "Leave withdrawn",
            message: `${employeeName} withdrew a pending leave request (${fromDate} to ${toDate}).`,
            type: "LEAVE_WITHDRAWN",
            leaveId: leave._id
        }),
        notifyEmployeeUser(leave.employee, {
            title: "Leave withdrawn",
            message: `Your pending leave request from ${fromDate} to ${toDate} has been withdrawn.`,
            type: "LEAVE_WITHDRAWN",
            leaveId: leave._id
        })
    ]);
}

async function notifyLeaveCancelledByAdmin(leave, adminRemark = "") {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);
    const remarkSuffix = adminRemark ? ` Remark: ${adminRemark}` : "";

    await notifyEmployeeUser(leave.employee, {
        title: "Leave cancelled",
        message: `Your leave request from ${fromDate} to ${toDate} has been cancelled by an administrator.${remarkSuffix}`,
        type: "LEAVE_CANCELLED",
        leaveId: leave._id
    });
}

module.exports = {
    LEAVE_NOTIFICATION_TYPES,
    notifyLeaveApplied,
    notifyLeaveApproved,
    notifyLeaveRejected,
    notifyLeaveWithdrawn,
    notifyLeaveCancelledByAdmin
};
