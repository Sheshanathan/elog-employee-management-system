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

/*
 * Get all active admin users.
 *
 * Admin role is matched using the actual Admin role used
 * throughout the application.
 *
 * isActive is explicitly checked so disabled admins do
 * not receive notifications.
 */
async function getActiveAdminIds() {
    const admins = await User.find({
        role: "Admin",
        isActive: true
    }).select("_id");

    return admins.map((admin) => admin._id);
}

/*
 * Find the active User account linked to an Employee.
 */
async function getEmployeeUserId(employeeId) {
    if (!employeeId) {
        return null;
    }

    const user = await User.findOne({
        employee: employeeId,
        role: "Employee",
        isActive: true
    }).select("_id");

    return user ? user._id : null;
}

/*
 * Create one notification.
 */
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

/*
 * Send notification to every active admin.
 */
async function notifyActiveAdmins({
    title,
    message,
    type,
    leaveId
}) {
    const adminIds = await getActiveAdminIds();

    console.log(
        `[Notifications] Active admins found: ${adminIds.length}`
    );

    if (adminIds.length === 0) {
        console.warn(
            "[Notifications] No active admin users found."
        );

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

    try {
        const notifications = await Notification.insertMany(
            payload,
            { ordered: false }
        );

        console.log(
            `[Notifications] Admin notifications created: ${notifications.length}`
        );

        return notifications;
    } catch (error) {
        console.error(
            "[Notifications] Failed to create admin notifications:",
            error
        );

        return [];
    }
}

/*
 * Send notification to employee.
 */
async function notifyEmployeeUser(
    employeeId,
    {
        title,
        message,
        type,
        leaveId
    }
) {
    const recipientId = await getEmployeeUserId(employeeId);

    return createNotification({
        recipientId,
        title,
        message,
        type,
        relatedEntityId: leaveId
    });
}

/*
 * Employee submits leave.
 *
 * ADMIN  -> New leave request
 * EMPLOYEE -> Leave submitted
 */
async function notifyLeaveApplied(leave, employeeName) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    await Promise.all([
        notifyActiveAdmins({
            title: "New leave request",
            message:
                `New leave request submitted by ${employeeName}.`,
            type: "LEAVE_APPLIED",
            leaveId: leave._id
        }),

        notifyEmployeeUser(leave.employee, {
            title: "Leave submitted",
            message:
                `Your leave request from ${fromDate} to ${toDate} has been submitted and is pending approval.`,
            type: "LEAVE_APPLIED",
            leaveId: leave._id
        })
    ]);
}

/*
 * Admin approves leave.
 *
 * EMPLOYEE -> Leave approved
 */
async function notifyLeaveApproved(leave) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    const remarkSuffix = leave.adminRemark
        ? ` Remark: ${leave.adminRemark}`
        : "";

    await notifyEmployeeUser(leave.employee, {
        title: "Leave approved",
        message:
            `Your leave request from ${fromDate} to ${toDate} has been approved.${remarkSuffix}`,
        type: "LEAVE_APPROVED",
        leaveId: leave._id
    });
}

/*
 * Admin rejects leave.
 *
 * EMPLOYEE -> Leave rejected
 */
async function notifyLeaveRejected(leave) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    const remarkSuffix = leave.rejectionReason
        ? ` Remark: ${leave.rejectionReason}`
        : "";

    await notifyEmployeeUser(leave.employee, {
        title: "Leave rejected",
        message:
            `Your leave request from ${fromDate} to ${toDate} has been rejected.${remarkSuffix}`,
        type: "LEAVE_REJECTED",
        leaveId: leave._id
    });
}

/*
 * Employee withdraws pending leave.
 *
 * ADMIN -> Leave withdrawn
 * EMPLOYEE -> Leave withdrawn
 */
async function notifyLeaveWithdrawn(leave, employeeName) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    await Promise.all([
        notifyActiveAdmins({
            title: "Leave withdrawn",
            message:
                `${employeeName} withdrew a pending leave request (${fromDate} to ${toDate}).`,
            type: "LEAVE_WITHDRAWN",
            leaveId: leave._id
        }),

        notifyEmployeeUser(leave.employee, {
            title: "Leave withdrawn",
            message:
                `Your pending leave request from ${fromDate} to ${toDate} has been withdrawn.`,
            type: "LEAVE_WITHDRAWN",
            leaveId: leave._id
        })
    ]);
}

/*
 * Admin cancels leave.
 *
 * EMPLOYEE -> Leave cancelled
 */
async function notifyLeaveCancelledByAdmin(
    leave,
    adminRemark = ""
) {
    const fromDate = formatLeaveDate(leave.fromDate);
    const toDate = formatLeaveDate(leave.toDate);

    const remarkSuffix = adminRemark
        ? ` Remark: ${adminRemark}`
        : "";

    await notifyEmployeeUser(leave.employee, {
        title: "Leave cancelled",
        message:
            `Your leave request from ${fromDate} to ${toDate} has been cancelled by an administrator.${remarkSuffix}`,
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