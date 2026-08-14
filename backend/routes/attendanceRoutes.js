const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const attendanceController = require("../controllers/attendanceController");


/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve attendance
 */
router.get(
    "/attendance",
    auth,
    admin,
    attendanceController.getAttendance
);


/**
 * @swagger
 * /attendance/my:
 *   get:
 *     summary: Get logged-in employee attendance
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee attendance retrieved successfully
 *       400:
 *         description: Employee profile is not linked
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employee access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve attendance
 */
router.get(
    "/attendance/my",
    auth,
    attendanceController.getMyAttendance
);


/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Employee check-in
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Check-in successful
 *       400:
 *         description: Employee profile is not linked
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employee access required
 *       404:
 *         description: User or employee not found
 *       409:
 *         description: Already checked in today
 *       500:
 *         description: Failed to check in
 */
router.post(
    "/attendance/check-in",
    auth,
    attendanceController.checkIn
);


/**
 * @swagger
 * /attendance/check-out:
 *   put:
 *     summary: Employee check-out
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out successful
 *       400:
 *         description: Check-in required before check-out
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employee access required
 *       404:
 *         description: Attendance not found
 *       409:
 *         description: Already checked out today
 *       500:
 *         description: Failed to check out
 */
router.put(
    "/attendance/check-out",
    auth,
    attendanceController.checkOut
);

router.patch(
    "/attendance/my/times",
    auth,
    attendanceController.updateMyTimes
);

router.post(
    "/attendance/my/submit-day",
    auth,
    attendanceController.submitDay
);


/**
 * @swagger
 * /attendance/{id}:
 *   get:
 *     summary: Get attendance by ID
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance retrieved successfully
 *       400:
 *         description: Invalid attendance ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Attendance not found
 *       500:
 *         description: Failed to retrieve attendance
 */
/**
 * @swagger
 * /attendance/employee/{employeeId}:
 *   get:
 *     summary: Get attendance for an employee
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee attendance retrieved successfully
 *       400:
 *         description: Invalid employee ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve employee attendance
 */
router.get(
    "/attendance/employee/:employeeId",
    auth,
    admin,
    attendanceController.getEmployeeAttendance
);

// Keep static/specific routes before this parameterized route.
router.get(
    "/attendance/:id",
    auth,
    admin,
    attendanceController.getAttendanceById
);


/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Create attendance manually
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee
 *               - date
 *               - status
 *             properties:
 *               employee:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum:
 *                   - Present
 *                   - Absent
 *                   - Leave
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               workingHours:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Attendance already exists
 *       500:
 *         description: Failed to create attendance
 */
router.post(
    "/attendance",
    auth,
    admin,
    attendanceController.createAttendance
);


/**
 * @swagger
 * /attendance/{id}:
 *   put:
 *     summary: Update attendance
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Attendance not found
 *       409:
 *         description: Attendance already exists
 *       500:
 *         description: Failed to update attendance
 */
router.put(
    "/attendance/:id",
    auth,
    admin,
    attendanceController.updateAttendance
);


/**
 * @swagger
 * /attendance/{id}:
 *   delete:
 *     summary: Delete attendance
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance deleted successfully
 *       400:
 *         description: Invalid attendance ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Attendance not found
 *       500:
 *         description: Failed to delete attendance
 */
router.delete(
    "/attendance/:id",
    auth,
    admin,
    attendanceController.deleteAttendance
);

module.exports = router;
