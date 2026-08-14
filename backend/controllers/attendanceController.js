const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const User = require("../models/User");
const mongoose = require("mongoose");
const { EMPLOYEE_NESTED_POPULATE } = require("../utils/employeeHelpers");
const {
    MAX_TIME_EDITS,
    computeWorkingHours,
    isWithinEditWindow,
    buildDateTimeOnSameDay,
    parseTimeOnDate
} = require("../utils/attendanceHelpers");

async function getEmployeeUser(req) {
    const user = await User.findById(req.user.id);

    if (!user) {
        return { error: { status: 404, message: "User Not Found" } };
    }

    if (user.role !== "Employee") {
        return { error: { status: 403, message: "Employee access required" } };
    }

    if (!user.employee) {
        return {
            error: {
                status: 400,
                message: "No employee profile is linked to this account"
            }
        };
    }

    return { user };
}

function getTodayRange(referenceDate = new Date()) {
    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(referenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

async function getAttendance(req, res) {
    try {
        const attendance = await Attendance.find()
            .populate(EMPLOYEE_NESTED_POPULATE)
            .sort({ date: -1 });

        res.status(200).json(attendance);
    } catch (error) {
        console.error("Get Attendance Error:", error);

        res.status(500).json({
            message: "Failed to retrieve attendance"
        });
    }
}

async function getAttendanceById(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Attendance ID"
            });
        }

        const attendance = await Attendance.findById(
            req.params.id
        ).populate(EMPLOYEE_NESTED_POPULATE);

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance Not Found"
            });
        }

        res.status(200).json(attendance);
    } catch (error) {
        console.error("Get Attendance By ID Error:", error);

        res.status(500).json({
            message: "Failed to retrieve attendance"
        });
    }
}

async function getEmployeeAttendance(req, res) {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.employeeId
            )
        ) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const attendance = await Attendance.find({
            employee: req.params.employeeId
        })
            .populate(EMPLOYEE_NESTED_POPULATE)
            .sort({ date: -1 });

        res.status(200).json(attendance);
    } catch (error) {
        console.error(
            "Get Employee Attendance Error:",
            error
        );

        res.status(500).json({
            message: "Failed to retrieve employee attendance"
        });
    }
}

async function createAttendance(req, res) {
    try {
        const {
            employee,
            date,
            status,
            remarks,
            checkIn,
            checkOut,
            workingHours
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(employee)) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const employeeExists =
            await Employee.findById(employee);

        if (!employeeExists) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        const attendanceDate = new Date(date);

        if (isNaN(attendanceDate.getTime())) {
            return res.status(400).json({
                message: "Invalid attendance date"
            });
        }

        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance =
            await Attendance.findOne({
                employee,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

        if (existingAttendance) {
            return res.status(409).json({
                message:
                    "Attendance already exists for this employee on this date"
            });
        }

        const attendance =
            await Attendance.create({
                employee,
                date: startOfDay,
                status,
                remarks,
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                workingHours:
                    workingHours !== undefined
                        ? Number(workingHours)
                        : 0
            });

        const populatedAttendance =
            await Attendance.findById(
                attendance._id
            ).populate(EMPLOYEE_NESTED_POPULATE);

        res.status(201).json({
            message: "Attendance Created Successfully",
            attendance: populatedAttendance
        });
    } catch (error) {
        console.error(
            "Create Attendance Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Attendance already exists for this employee on this date"
            });
        }

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach(
                (field) => {
                    errors[field] =
                        error.errors[field].message;
                }
            );

            return res.status(400).json({
                message: "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message: "Failed to create attendance"
        });
    }
}

async function updateAttendance(req, res) {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message: "Invalid Attendance ID"
            });
        }

        const {
            employee,
            date,
            status,
            remarks,
            checkIn,
            checkOut,
            workingHours
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(employee)) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const employeeExists =
            await Employee.findById(employee);

        if (!employeeExists) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        const attendanceDate = new Date(date);

        if (isNaN(attendanceDate.getTime())) {
            return res.status(400).json({
                message: "Invalid attendance date"
            });
        }

        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const duplicate =
            await Attendance.findOne({
                employee,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                _id: {
                    $ne: req.params.id
                }
            });

        if (duplicate) {
            return res.status(409).json({
                message:
                    "Attendance already exists for this employee on this date"
            });
        }

        const attendance =
            await Attendance.findByIdAndUpdate(
                req.params.id,
                {
                    employee,
                    date: startOfDay,
                    status,
                    remarks,
                    checkIn: checkIn || null,
                    checkOut: checkOut || null,
                    workingHours: computeWorkingHours(
                        checkIn || null,
                        checkOut || null
                    )
                },
                {
                    new: true,
                    runValidators: true
                }
            ).populate(EMPLOYEE_NESTED_POPULATE);

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance Not Found"
            });
        }

        res.status(200).json({
            message: "Attendance Updated Successfully",
            attendance
        });
    } catch (error) {
        console.error(
            "Update Attendance Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Attendance already exists for this employee on this date"
            });
        }

        res.status(500).json({
            message: "Failed to update attendance"
        });
    }
}

async function deleteAttendance(req, res) {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message: "Invalid Attendance ID"
            });
        }

        const attendance =
            await Attendance.findByIdAndDelete(
                req.params.id
            );

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance Not Found"
            });
        }

        res.status(200).json({
            message: "Attendance Deleted Successfully"
        });
    } catch (error) {
        console.error(
            "Delete Attendance Error:",
            error
        );

        res.status(500).json({
            message: "Failed to delete attendance"
        });
    }
}

async function checkIn(req, res) {
    try {
        const user = await User.findById(
            req.user.id
        );

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        if (user.role !== "Employee") {
            return res.status(403).json({
                message: "Employee access required"
            });
        }

        if (!user.employee) {
            return res.status(400).json({
                message:
                    "No employee profile is linked to this account"
            });
        }

        const employee =
            await Employee.findById(user.employee);

        if (!employee) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        const now = new Date();

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance =
            await Attendance.findOne({
                employee: employee._id,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

        if (existingAttendance) {
            if (existingAttendance.checkIn) {
                return res.status(409).json({
                    message:
                        "You have already checked in today"
                });
            }

            existingAttendance.checkIn = now;
            existingAttendance.originalCheckIn =
                existingAttendance.originalCheckIn || now;
            existingAttendance.status = "Present";

            await existingAttendance.save();

            return res.status(200).json({
                message: "Check-In Successful",
                attendance: existingAttendance
            });
        }

        const attendance =
            await Attendance.create({
                employee: employee._id,
                date: startOfDay,
                checkIn: now,
                originalCheckIn: now,
                status: "Present",
                workingHours: 0
            });

        const populatedAttendance =
            await Attendance.findById(
                attendance._id
            ).populate(EMPLOYEE_NESTED_POPULATE);

        res.status(201).json({
            message: "Check-In Successful",
            attendance: populatedAttendance
        });
    } catch (error) {
        console.error("Check-In Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "You have already checked in today"
            });
        }

        res.status(500).json({
            message: "Failed to check in"
        });
    }
}

async function checkOut(req, res) {
    try {
        const user = await User.findById(
            req.user.id
        );

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        if (user.role !== "Employee") {
            return res.status(403).json({
                message: "Employee access required"
            });
        }

        if (!user.employee) {
            return res.status(400).json({
                message:
                    "No employee profile is linked to this account"
            });
        }

        const now = new Date();

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance =
            await Attendance.findOne({
                employee: user.employee,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

        if (!attendance) {
            return res.status(404).json({
                message:
                    "Please check in before checking out"
            });
        }

        if (!attendance.checkIn) {
            return res.status(400).json({
                message:
                    "Please check in before checking out"
            });
        }

        if (attendance.checkOut) {
            return res.status(409).json({
                message:
                    "You have already checked out today"
            });
        }

        attendance.checkOut = now;
        attendance.originalCheckOut =
            attendance.originalCheckOut || now;

        attendance.workingHours = computeWorkingHours(
            attendance.checkIn,
            attendance.checkOut
        );

        await attendance.save();

        const populatedAttendance =
            await Attendance.findById(
                attendance._id
            ).populate(EMPLOYEE_NESTED_POPULATE);

        res.status(200).json({
            message: "Check-Out Successful",
            attendance: populatedAttendance
        });
    } catch (error) {
        console.error("Check-Out Error:", error);

        res.status(500).json({
            message: "Failed to check out"
        });
    }
}

async function getMyAttendance(req, res) {
    try {
        const employeeUser = await getEmployeeUser(req);

        if (employeeUser.error) {
            return res.status(employeeUser.error.status).json({
                message: employeeUser.error.message
            });
        }

        const attendance =
            await Attendance.find({
                employee: employeeUser.user.employee
            })
                .populate(EMPLOYEE_NESTED_POPULATE)
                .sort({ date: -1 });

        res.status(200).json(attendance);
    } catch (error) {
        console.error(
            "Get My Attendance Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve your attendance"
        });
    }
}

async function updateMyTimes(req, res) {
    try {
        const employeeUser = await getEmployeeUser(req);

        if (employeeUser.error) {
            return res.status(employeeUser.error.status).json({
                message: employeeUser.error.message
            });
        }

        const { checkIn, checkOut } = req.body;
        const { startOfDay, endOfDay } = getTodayRange();

        const attendance = await Attendance.findOne({
            employee: employeeUser.user.employee,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (!attendance) {
            return res.status(404).json({
                message: "No attendance record found for today"
            });
        }

        if (attendance.daySubmitted) {
            return res.status(409).json({
                message: "Today's attendance has already been submitted and cannot be edited"
            });
        }

        if (attendance.timeEditCount >= MAX_TIME_EDITS) {
            return res.status(409).json({
                message: `You have used all ${MAX_TIME_EDITS} time edits for today`
            });
        }

        if (!checkIn && !checkOut) {
            return res.status(400).json({
                message: "Provide at least one time to update"
            });
        }

        const nextCheckIn = checkIn
            ? parseTimeOnDate(attendance.date, checkIn)
            : attendance.checkIn;
        const nextCheckOut = checkOut
            ? parseTimeOnDate(attendance.date, checkOut)
            : attendance.checkOut;

        if (checkIn) {
            if (!attendance.originalCheckIn) {
                return res.status(400).json({
                    message: "Original check-in time is missing"
                });
            }

            if (!isWithinEditWindow(attendance.originalCheckIn, nextCheckIn)) {
                return res.status(400).json({
                    message: "Check-in time can only be adjusted within 30 minutes of the original time"
                });
            }

            attendance.checkIn = nextCheckIn;
        }

        if (checkOut) {
            if (!attendance.originalCheckOut) {
                return res.status(400).json({
                    message: "Please check out before editing check-out time"
                });
            }

            if (!isWithinEditWindow(attendance.originalCheckOut, nextCheckOut)) {
                return res.status(400).json({
                    message: "Check-out time can only be adjusted within 30 minutes of the original time"
                });
            }

            attendance.checkOut = nextCheckOut;
        }

        if (attendance.checkIn && attendance.checkOut &&
            new Date(attendance.checkOut) <= new Date(attendance.checkIn)) {
            return res.status(400).json({
                message: "Check-out time must be after check-in time"
            });
        }

        attendance.workingHours = computeWorkingHours(
            attendance.checkIn,
            attendance.checkOut
        );
        attendance.timeEditCount += 1;

        await attendance.save();

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate(EMPLOYEE_NESTED_POPULATE);

        res.status(200).json({
            message: "Attendance times updated successfully",
            attendance: populatedAttendance,
            editsRemaining: MAX_TIME_EDITS - attendance.timeEditCount
        });
    } catch (error) {
        console.error("Update My Times Error:", error);

        res.status(500).json({
            message: "Failed to update attendance times"
        });
    }
}

async function submitDay(req, res) {
    try {
        const employeeUser = await getEmployeeUser(req);

        if (employeeUser.error) {
            return res.status(employeeUser.error.status).json({
                message: employeeUser.error.message
            });
        }

        const { startOfDay, endOfDay } = getTodayRange();

        const attendance = await Attendance.findOne({
            employee: employeeUser.user.employee,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (!attendance) {
            return res.status(404).json({
                message: "No attendance record found for today"
            });
        }

        if (!attendance.checkIn || !attendance.checkOut) {
            return res.status(400).json({
                message: "Both check-in and check-out are required before submitting the day"
            });
        }

        if (attendance.daySubmitted) {
            return res.status(409).json({
                message: "Today's attendance has already been submitted"
            });
        }

        attendance.daySubmitted = true;
        attendance.submittedAt = new Date();
        attendance.workingHours = computeWorkingHours(
            attendance.checkIn,
            attendance.checkOut
        );

        await attendance.save();

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate(EMPLOYEE_NESTED_POPULATE);

        res.status(200).json({
            message: "Today's attendance submitted successfully",
            attendance: populatedAttendance
        });
    } catch (error) {
        console.error("Submit Day Error:", error);

        res.status(500).json({
            message: "Failed to submit attendance for today"
        });
    }
}

module.exports = {
    getAttendance,
    getAttendanceById,
    getEmployeeAttendance,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    checkIn,
    checkOut,
    getMyAttendance,
    updateMyTimes,
    submitDay
};