const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const User = require("../models/User");
const mongoose = require("mongoose");


/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const VALID_LEAVE_TYPES = [
    "Casual Leave",
    "Sick Leave",
    "Earned Leave",
    "Unpaid Leave",
    "Optional Holiday"
];

const VALID_STATUSES = [
    "Pending",
    "Approved",
    "Rejected",
    "Cancelled"
];


/*
 * =========================================================
 * HELPER FUNCTIONS
 * =========================================================
 */


/*
 * Check whether a value is a valid MongoDB ObjectId.
 */
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}


/*
 * Convert date to start of day.
 */
function startOfDay(date) {
    const result = new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


/*
 * Convert date to end of day.
 */
function endOfDay(date) {
    const result = new Date(date);

    result.setHours(
        23,
        59,
        59,
        999
    );

    return result;
}


/*
 * Validate whether a date is valid.
 */
function isValidDate(date) {
    return (
        date instanceof Date &&
        !Number.isNaN(date.getTime())
    );
}


/*
 * Calculate number of leave days.

 * Example:
 * 2026-08-20 to 2026-08-20 = 1 day
 * 2026-08-20 to 2026-08-22 = 3 days
 */
function calculateLeaveDays(
    fromDate,
    toDate
) {
    const start = startOfDay(fromDate);
    const end = startOfDay(toDate);

    const difference =
        end.getTime() -
        start.getTime();

    return (
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        ) + 1
    );
}


/*
 * Validate leave dates.
 */
function validateLeaveDates(
    fromDate,
    toDate
) {
    const errors = {};

    if (!fromDate) {
        errors.fromDate =
            "From date is required";
    }

    if (!toDate) {
        errors.toDate =
            "To date is required";
    }

    if (
        fromDate &&
        !isValidDate(fromDate)
    ) {
        errors.fromDate =
            "From date must be a valid date";
    }

    if (
        toDate &&
        !isValidDate(toDate)
    ) {
        errors.toDate =
            "To date must be a valid date";
    }

    if (
        isValidDate(fromDate) &&
        isValidDate(toDate)
    ) {
        const start =
            startOfDay(fromDate);

        const end =
            startOfDay(toDate);

        if (end < start) {
            errors.toDate =
                "To date cannot be before from date";
        }
    }

    return errors;
}


/*
 * Check whether employee already has
 * an overlapping leave.
 *
 * Only Pending and Approved leaves
 * are considered conflicts.
 */
async function findOverlappingLeave(
    employeeId,
    fromDate,
    toDate,
    excludeLeaveId = null
) {
    const query = {
        employee: employeeId,

        status: {
            $in: [
                "Pending",
                "Approved"
            ]
        },

        fromDate: {
            $lte: endOfDay(toDate)
        },

        toDate: {
            $gte: startOfDay(fromDate)
        }
    };

    if (excludeLeaveId) {
        query._id = {
            $ne: excludeLeaveId
        };
    }

    return await Leave.findOne(query);
}


/*
 * Get employee linked to logged-in user.
 */
async function getEmployeeFromUser(
    userId
) {
    if (
        !isValidObjectId(userId)
    ) {
        return null;
    }

    const user =
        await User.findById(userId);

    if (!user) {
        return null;
    }

    if (!user.employee) {
        return null;
    }

    const employee =
        await Employee.findById(
            user.employee
        );

    return employee;
}


/*
 * =========================================================
 * GET ALL LEAVES
 * =========================================================
 */

exports.getLeaves = async (
    req,
    res
) => {
    try {
        const {
            status,
            employee,
            leaveType
        } = req.query;

        const filter = {};

        /*
         * Status filter
         */
        if (status) {
            if (
                !VALID_STATUSES.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid leave status"
                });
            }

            filter.status = status;
        }

        /*
         * Employee filter
         */
        if (employee) {
            if (
                !isValidObjectId(employee)
            ) {
                return res.status(400).json({
                    message:
                        "Invalid employee ID"
                });
            }

            filter.employee = employee;
        }

        /*
         * Leave type filter
         */
        if (leaveType) {
            if (
                !VALID_LEAVE_TYPES.includes(
                    leaveType
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid leave type"
                });
            }

            filter.leaveType =
                leaveType;
        }

        const leaves =
            await Leave.find(filter)
                .populate(
                    "employee",
                    "employeeId name email department designation"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json(
            leaves
        );

    } catch (error) {
        console.error(
            "Get Leaves Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve leave requests"
        });
    }
};


/*
 * =========================================================
 * GET MY LEAVES
 * =========================================================
 */

exports.getMyLeaves = async (
    req,
    res
) => {
    try {
        const employee =
            await getEmployeeFromUser(
                req.user.id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee profile not found"
            });
        }

        const filter = {
            employee: employee._id
        };

        if (req.query.status) {
            if (
                !VALID_STATUSES.includes(
                    req.query.status
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid leave status"
                });
            }

            filter.status =
                req.query.status;
        }

        const leaves =
            await Leave.find(filter)
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json(
            leaves
        );

    } catch (error) {
        console.error(
            "Get My Leaves Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve leave requests"
        });
    }
};


/*
 * =========================================================
 * GET LEAVE BY ID
 * =========================================================
 */

exports.getLeaveById = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                message:
                    "Invalid Leave ID"
            });
        }

        const leave =
            await Leave.findById(id)
                .populate(
                    "employee",
                    "employeeId name email department designation"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                );

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }

        /*
         * Admin can view everything.
         */
        if (
            req.user.role === "Admin" ||
            req.user.role === "SUPER_ADMIN" ||
            req.user.role === "ADMIN"
        ) {
            return res.status(200).json(
                leave
            );
        }

        /*
         * Employee can view only own leave.
         */
        const employee =
            await getEmployeeFromUser(
                req.user.id
            );

        if (
            !employee ||
            leave.employee._id.toString() !==
                employee._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to view this leave request"
            });
        }

        return res.status(200).json(
            leave
        );

    } catch (error) {
        console.error(
            "Get Leave By ID Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve leave request"
        });
    }
};


/*
 * =========================================================
 * CREATE LEAVE
 * =========================================================
 */

exports.createLeave = async (
    req,
    res
) => {
    try {
        /*
         * Get employee from logged-in user.
         */
        const employee =
            await getEmployeeFromUser(
                req.user.id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee profile not found"
            });
        }

        /*
         * Extract request data.
         */
        const {
            leaveType,
            fromDate,
            toDate,
            days,
            reason
        } = req.body;

        const errors = {};

        /*
         * Leave type validation.
         */
        if (!leaveType) {
            errors.leaveType =
                "Leave type is required";
        } else if (
            !VALID_LEAVE_TYPES.includes(
                leaveType
            )
        ) {
            errors.leaveType =
                "Invalid leave type";
        }

        /*
         * Reason validation.
         */
        const cleanedReason =
            typeof reason === "string"
                ? reason.trim()
                : "";

        if (!cleanedReason) {
            errors.reason =
                "Reason is required";
        } else if (
            cleanedReason.length < 3
        ) {
            errors.reason =
                "Reason must contain at least 3 characters";
        } else if (
            cleanedReason.length > 500
        ) {
            errors.reason =
                "Reason cannot exceed 500 characters";
        }

        /*
         * Date conversion.
         */
        const parsedFromDate =
            fromDate
                ? new Date(fromDate)
                : null;

        const parsedToDate =
            toDate
                ? new Date(toDate)
                : null;

        /*
         * Date validation.
         */
        Object.assign(
            errors,
            validateLeaveDates(
                parsedFromDate,
                parsedToDate
            )
        );

        /*
         * Prevent past leave.
         */
        if (
            isValidDate(
                parsedFromDate
            )
        ) {
            const today =
                startOfDay(
                    new Date()
                );

            if (
                startOfDay(
                    parsedFromDate
                ) < today
            ) {
                errors.fromDate =
                    "Leave cannot start in the past";
            }
        }

        /*
         * Validate supplied days if provided.
         */
        const calculatedDays =
            isValidDate(
                parsedFromDate
            ) &&
            isValidDate(
                parsedToDate
            )
                ? calculateLeaveDays(
                      parsedFromDate,
                      parsedToDate
                  )
                : null;

        if (
            days !== undefined &&
            days !== null &&
            days !== ""
        ) {
            const numericDays =
                Number(days);

            if (
                Number.isNaN(
                    numericDays
                ) ||
                numericDays <= 0
            ) {
                errors.days =
                    "Days must be greater than 0";
            } else if (
                calculatedDays !== null &&
                numericDays !==
                    calculatedDays
            ) {
                errors.days =
                    "Days must match the selected date range";
            }
        }

        /*
         * Return validation errors.
         */
        if (
            Object.keys(errors)
                .length > 0
        ) {
            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        /*
         * Check overlapping leave.
         */
        const overlappingLeave =
            await findOverlappingLeave(
                employee._id,
                parsedFromDate,
                parsedToDate
            );

        if (overlappingLeave) {
            return res.status(409).json({
                message:
                    "You already have a pending or approved leave during the selected dates",
                conflictingLeave: {
                    id:
                        overlappingLeave._id,
                    fromDate:
                        overlappingLeave.fromDate,
                    toDate:
                        overlappingLeave.toDate,
                    status:
                        overlappingLeave.status
                }
            });
        }

        /*
         * Create leave.
         */
        const leave =
            await Leave.create({
                employee:
                    employee._id,

                leaveType,

                fromDate:
                    startOfDay(
                        parsedFromDate
                    ),

                toDate:
                    startOfDay(
                        parsedToDate
                    ),

                days:
                    calculatedDays,

                reason:
                    cleanedReason,

                status:
                    "Pending"
            });

        /*
         * Populate response.
         */
        await leave.populate(
            "employee",
            "employeeId name email"
        );

        return res.status(201).json({
            message:
                "Leave request created successfully",
            leave
        });

    } catch (error) {
        console.error(
            "Create Leave Error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const errors = {};

            Object.keys(
                error.errors
            ).forEach(
                (field) => {
                    errors[field] =
                        error.errors[
                            field
                        ].message;
                }
            );

            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        return res.status(500).json({
            message:
                "Failed to create leave request"
        });
    }
};


/*
 * =========================================================
 * UPDATE LEAVE
 * =========================================================
 */

exports.updateLeave = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                message:
                    "Invalid Leave ID"
            });
        }

        const leave =
            await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }

        /*
         * Only pending leaves can be edited.
         */
        if (
            leave.status !== "Pending"
        ) {
            return res.status(403).json({
                message:
                    "Only pending leave requests can be updated"
            });
        }

        /*
         * Employee can update only own leave.
         */
        const employee =
            await getEmployeeFromUser(
                req.user.id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee profile not found"
            });
        }

        if (
            leave.employee.toString() !==
            employee._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only update your own leave request"
            });
        }

        const {
            leaveType,
            fromDate,
            toDate,
            days,
            reason
        } = req.body;

        const errors = {};

        /*
         * Leave type.
         */
        if (!leaveType) {
            errors.leaveType =
                "Leave type is required";
        } else if (
            !VALID_LEAVE_TYPES.includes(
                leaveType
            )
        ) {
            errors.leaveType =
                "Invalid leave type";
        }

        /*
         * Reason.
         */
        const cleanedReason =
            typeof reason === "string"
                ? reason.trim()
                : "";

        if (!cleanedReason) {
            errors.reason =
                "Reason is required";
        } else if (
            cleanedReason.length < 3
        ) {
            errors.reason =
                "Reason must contain at least 3 characters";
        } else if (
            cleanedReason.length > 500
        ) {
            errors.reason =
                "Reason cannot exceed 500 characters";
        }

        /*
         * Dates.
         */
        const parsedFromDate =
            fromDate
                ? new Date(fromDate)
                : null;

        const parsedToDate =
            toDate
                ? new Date(toDate)
                : null;

        Object.assign(
            errors,
            validateLeaveDates(
                parsedFromDate,
                parsedToDate
            )
        );

        /*
         * Prevent past leave.
         */
        if (
            isValidDate(
                parsedFromDate
            )
        ) {
            const today =
                startOfDay(
                    new Date()
                );

            if (
                startOfDay(
                    parsedFromDate
                ) < today
            ) {
                errors.fromDate =
                    "Leave cannot start in the past";
            }
        }

        const calculatedDays =
            isValidDate(
                parsedFromDate
            ) &&
            isValidDate(
                parsedToDate
            )
                ? calculateLeaveDays(
                      parsedFromDate,
                      parsedToDate
                  )
                : null;

        if (
            days !== undefined &&
            days !== null &&
            days !== ""
        ) {
            const numericDays =
                Number(days);

            if (
                Number.isNaN(
                    numericDays
                ) ||
                numericDays <= 0
            ) {
                errors.days =
                    "Days must be greater than 0";
            } else if (
                calculatedDays !== null &&
                numericDays !==
                    calculatedDays
            ) {
                errors.days =
                    "Days must match the selected date range";
            }
        }

        if (
            Object.keys(errors)
                .length > 0
        ) {
            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        /*
         * Check overlapping leave,
         * excluding current leave.
         */
        const overlappingLeave =
            await findOverlappingLeave(
                employee._id,
                parsedFromDate,
                parsedToDate,
                leave._id
            );

        if (overlappingLeave) {
            return res.status(409).json({
                message:
                    "You already have another pending or approved leave during the selected dates"
            });
        }

        /*
         * Update leave.
         */
        leave.leaveType =
            leaveType;

        leave.fromDate =
            startOfDay(
                parsedFromDate
            );

        leave.toDate =
            startOfDay(
                parsedToDate
            );

        leave.days =
            calculatedDays;

        leave.reason =
            cleanedReason;

        await leave.save();

        await leave.populate(
            "employee",
            "employeeId name email"
        );

        return res.status(200).json({
            message:
                "Leave request updated successfully",
            leave
        });

    } catch (error) {
        console.error(
            "Update Leave Error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const errors = {};

            Object.keys(
                error.errors
            ).forEach(
                (field) => {
                    errors[field] =
                        error.errors[
                            field
                        ].message;
                }
            );

            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        return res.status(500).json({
            message:
                "Failed to update leave request"
        });
    }
};


/*
 * =========================================================
 * CANCEL LEAVE
 * =========================================================
 */

exports.cancelLeave = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                message:
                    "Invalid Leave ID"
            });
        }

        const leave =
            await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }

        const employee =
            await getEmployeeFromUser(
                req.user.id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee profile not found"
            });
        }

        if (
            leave.employee.toString() !==
            employee._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only cancel your own leave request"
            });
        }

        /*
         * Only Pending or Approved
         * leaves can be cancelled.
         */
        if (
            ![
                "Pending",
                "Approved"
            ].includes(
                leave.status
            )
        ) {
            return res.status(400).json({
                message:
                    `Leave request cannot be cancelled because its current status is ${leave.status}`
            });
        }

        leave.status =
            "Cancelled";

        await leave.save();

        return res.status(200).json({
            message:
                "Leave request cancelled successfully",
            leave
        });

    } catch (error) {
        console.error(
            "Cancel Leave Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to cancel leave request"
        });
    }
};


/*
 * =========================================================
 * APPROVE LEAVE
 * =========================================================
 */

exports.approveLeave = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                message:
                    "Invalid Leave ID"
            });
        }

        const leave =
            await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }

        /*
         * Only pending leaves can
         * be approved.
         */
        if (
            leave.status !== "Pending"
        ) {
            return res.status(400).json({
                message:
                    `Only pending leave requests can be approved. Current status: ${leave.status}`
            });
        }

        /*
         * Check employee still exists.
         */
        const employee =
            await Employee.findById(
                leave.employee
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee profile not found"
            });
        }

        /*
         * Prevent overlapping approved
         * or pending leave.
         *
         * Exclude current leave.
         */
        const overlappingLeave =
            await findOverlappingLeave(
                leave.employee,
                leave.fromDate,
                leave.toDate,
                leave._id
            );

        if (overlappingLeave) {
            return res.status(409).json({
                message:
                    "This leave overlaps with another pending or approved leave"
            });
        }

        /*
         * Approve.
         */
        leave.status =
            "Approved";

        leave.approvedBy =
            req.user.id;

        leave.approvedAt =
            new Date();

        /*
         * Clear rejection reason
         * if any previous value exists.
         */
        leave.rejectionReason =
            null;

        await leave.save();

        await leave.populate([
            {
                path: "employee",
                select:
                    "employeeId name email"
            },
            {
                path: "approvedBy",
                select:
                    "name email role"
            }
        ]);

        return res.status(200).json({
            message:
                "Leave request approved successfully",
            leave
        });

    } catch (error) {
        console.error(
            "Approve Leave Error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                message:
                    "Validation failed"
            });
        }

        return res.status(500).json({
            message:
                "Failed to approve leave request"
        });
    }
};


/*
 * =========================================================
 * REJECT LEAVE
 * =========================================================
 */

exports.rejectLeave = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                message:
                    "Invalid Leave ID"
            });
        }

        const leave =
            await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }

        /*
         * Only pending leaves can
         * be rejected.
         */
        if (
            leave.status !== "Pending"
        ) {
            return res.status(400).json({
                message:
                    `Only pending leave requests can be rejected. Current status: ${leave.status}`
            });
        }

        /*
         * Validate rejection reason.
         */
        const rejectionReason =
            typeof req.body.rejectionReason ===
            "string"
                ? req.body.rejectionReason.trim()
                : "";

        if (!rejectionReason) {
            return res.status(400).json({
                message:
                    "Rejection reason is required",
                errors: {
                    rejectionReason:
                        "Rejection reason is required"
                }
            });
        }

        if (
            rejectionReason.length < 3
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason must contain at least 3 characters",
                errors: {
                    rejectionReason:
                        "Rejection reason must contain at least 3 characters"
                }
            });
        }

        if (
            rejectionReason.length > 500
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason cannot exceed 500 characters",
                errors: {
                    rejectionReason:
                        "Rejection reason cannot exceed 500 characters"
                }
            });
        }

        /*
         * Reject.
         */
        leave.status =
            "Rejected";

        leave.rejectionReason =
            rejectionReason;

        leave.approvedBy =
            null;

        leave.approvedAt =
            null;

        await leave.save();

        await leave.populate(
            "employee",
            "employeeId name email"
        );

        return res.status(200).json({
            message:
                "Leave request rejected successfully",
            leave
        });

    } catch (error) {
        console.error(
            "Reject Leave Error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                message:
                    "Validation failed"
            });
        }

        return res.status(500).json({
            message:
                "Failed to reject leave request"
        });
    }
};


/*
 * =========================================================
 * DELETE LEAVE
 * =========================================================
 */

exports.deleteLeave = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                message:
                    "Invalid Leave ID"
            });
        }

        const leave =
            await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }

        /*
         * Prevent deleting approved
         * leave records accidentally.
         *
         * Admin can delete Pending,
         * Rejected and Cancelled records.
         */
        if (
            leave.status === "Approved"
        ) {
            return res.status(400).json({
                message:
                    "Approved leave requests cannot be deleted"
            });
        }

        await Leave.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            message:
                "Leave request deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Leave Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete leave request"
        });
    }
};


/*
 * =========================================================
 * GET MY LEAVE BALANCE
 * =========================================================
 */

exports.getMyLeaveBalance = async (
    req,
    res
) => {
    try {
        const employee =
            await getEmployeeFromUser(
                req.user.id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee profile not found"
            });
        }

        const leaves =
            await Leave.find({
                employee:
                    employee._id,

                status:
                    "Approved"
            });

        /*
         * Default annual balances.
         *
         * These can later be moved
         * into a LeaveBalance model.
         */
        const totalBalance = {
            "Casual Leave": 12,
            "Sick Leave": 12,
            "Earned Leave": 15,
            "Unpaid Leave": null,
            "Optional Holiday": 5
        };

        const usedBalance = {
            "Casual Leave": 0,
            "Sick Leave": 0,
            "Earned Leave": 0,
            "Unpaid Leave": 0,
            "Optional Holiday": 0
        };

        leaves.forEach(
            (leave) => {
                if (
                    Object.prototype.hasOwnProperty.call(
                        usedBalance,
                        leave.leaveType
                    )
                ) {
                    usedBalance[
                        leave.leaveType
                    ] += leave.days;
                }
            }
        );

        const balance = {};

        Object.keys(
            totalBalance
        ).forEach(
            (type) => {
                balance[type] = {
                    total:
                        totalBalance[type],

                    used:
                        usedBalance[type],

                    remaining:
                        totalBalance[type] ===
                        null
                            ? null
                            :
                                Math.max(
                                    0,
                                    totalBalance[
                                        type
                                    ] -
                                    usedBalance[
                                        type
                                    ]
                                )
                };
            }
        );

        return res.status(200).json({
            employee: {
                id:
                    employee._id,
                employeeId:
                    employee.employeeId,
                name:
                    employee.name
            },
            balance
        });

    } catch (error) {
        console.error(
            "Get My Leave Balance Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve leave balance"
        });
    }
};


/*
 * =========================================================
 * GET ALL LEAVE BALANCES
 * =========================================================
 */

exports.getAllLeaveBalances = async (
    req,
    res
) => {
    try {
        const employees =
            await Employee.find()
                .select(
                    "employeeId name email"
                )
                .sort({
                    name: 1
                });

        const results = [];

        for (
            const employee
            of employees
        ) {
            const leaves =
                await Leave.find({
                    employee:
                        employee._id,

                    status:
                        "Approved"
                });

            const totalBalance = {
                "Casual Leave": 12,
                "Sick Leave": 12,
                "Earned Leave": 15,
                "Unpaid Leave": null,
                "Optional Holiday": 5
            };

            const usedBalance = {
                "Casual Leave": 0,
                "Sick Leave": 0,
                "Earned Leave": 0,
                "Unpaid Leave": 0,
                "Optional Holiday": 0
            };

            leaves.forEach(
                (leave) => {
                    if (
                        Object.prototype.hasOwnProperty.call(
                            usedBalance,
                            leave.leaveType
                        )
                    ) {
                        usedBalance[
                            leave.leaveType
                        ] += leave.days;
                    }
                }
            );

            const balance = {};

            Object.keys(
                totalBalance
            ).forEach(
                (type) => {
                    balance[type] = {
                        total:
                            totalBalance[type],

                        used:
                            usedBalance[
                                type
                            ],

                        remaining:
                            totalBalance[
                                type
                            ] === null
                                ? null
                                :
                                    Math.max(
                                        0,
                                        totalBalance[
                                            type
                                        ] -
                                        usedBalance[
                                            type
                                        ]
                                    )
                    };
                }
            );

            results.push({
                employee: {
                    id:
                        employee._id,
                    employeeId:
                        employee.employeeId,
                    name:
                        employee.name,
                    email:
                        employee.email
                },

                balance
            });
        }

        return res.status(200).json(
            results
        );

    } catch (error) {
        console.error(
            "Get All Leave Balances Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve leave balances"
        });
    }
};


/*
 * =========================================================
 * GET LEAVE SUMMARY
 * =========================================================
 */

exports.getLeaveSummary = async (
    req,
    res
) => {
    try {
        const total =
            await Leave.countDocuments();

        const pending =
            await Leave.countDocuments({
                status:
                    "Pending"
            });

        const approved =
            await Leave.countDocuments({
                status:
                    "Approved"
            });

        const rejected =
            await Leave.countDocuments({
                status:
                    "Rejected"
            });

        const cancelled =
            await Leave.countDocuments({
                status:
                    "Cancelled"
            });

        /*
         * Leave type summary.
         */
        const byLeaveType =
            await Leave.aggregate([
                {
                    $group: {
                        _id:
                            "$leaveType",

                        count: {
                            $sum: 1
                        },

                        totalDays: {
                            $sum: "$days"
                        }
                    }
                },

                {
                    $project: {
                        _id: 0,

                        leaveType:
                            "$_id",

                        count: 1,

                        totalDays: 1
                    }
                },

                {
                    $sort: {
                        leaveType: 1
                    }
                }
            ]);

        return res.status(200).json({
            total,
            pending,
            approved,
            rejected,
            cancelled,
            byLeaveType
        });

    } catch (error) {
        console.error(
            "Get Leave Summary Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve leave summary"
        });
    }
};