const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const leaveController = require("../controllers/leaveController");

const {
    validateLeaveData
} = require("../middleware/validation");

/*
 * =========================================================
 * GET ALL LEAVES (ADMIN)
 * =========================================================
 */

/**
 * @swagger
 * /leaves:
 *   get:
 *     summary: Get all leave requests
 *     description: Retrieve all leave requests. Only administrators can access all leave records.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - Pending
 *             - Approved
 *             - Rejected
 *             - Cancelled
 *         description: Filter leave requests by status
 *       - in: query
 *         name: employee
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter leave requests by employee ID (MongoDB ObjectId)
 *       - in: query
 *         name: leaveType
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - Casual Leave
 *             - Sick Leave
 *             - Earned Leave
 *             - Unpaid Leave
 *             - Optional Holiday
 *         description: Filter leave requests by leave type
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by created date range (from)
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by created date range (to)
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid filter parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve leave requests
 */
router.get(
    "/leaves",
    auth,
    admin,
    leaveController.getLeaves
);

/*
 * =========================================================
 * GET MY LEAVES (EMPLOYEE)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/my:
 *   get:
 *     summary: Get my leave requests
 *     description: Retrieve leave requests belonging to the currently logged-in employee.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - Pending
 *             - Approved
 *             - Rejected
 *             - Cancelled
 *         description: Filter personal leave requests by status
 *     responses:
 *       200:
 *         description: Personal leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Leave'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Employee profile not found
 *       500:
 *         description: Failed to retrieve leave requests
 */
router.get(
    "/leaves/my",
    auth,
    leaveController.getMyLeaves
);

/*
 * =========================================================
 * GET MY LEAVE BALANCE (EMPLOYEE)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/balance/my:
 *   get:
 *     summary: Get my leave balance
 *     description: Retrieve the leave balance for the currently logged-in employee.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Employee profile not found
 *       500:
 *         description: Failed to retrieve leave balance
 */
router.get(
    "/leaves/balance/my",
    auth,
    leaveController.getMyLeaveBalance
);

/*
 * =========================================================
 * GET ALL LEAVE BALANCES (ADMIN)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/balances:
 *   get:
 *     summary: Get all employee leave balances
 *     description: Retrieve leave balances for all employees. Only administrators can access this endpoint.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee leave balances retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve leave balances
 */
router.get(
    "/leaves/balances",
    auth,
    admin,
    leaveController.getAllLeaveBalances
);

/*
 * =========================================================
 * GET LEAVE SUMMARY (ADMIN)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/summary:
 *   get:
 *     summary: Get leave summary
 *     description: Retrieve leave statistics including pending, approved, rejected, and cancelled requests.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave summary retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve leave summary
 */
router.get(
    "/leaves/summary",
    auth,
    admin,
    leaveController.getLeaveSummary
);

/*
 * =========================================================
 * GET LEAVE STATISTICS BY DEPARTMENT (ADMIN)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/statistics/department:
 *   get:
 *     summary: Get leave statistics by department
 *     description: Retrieve leave statistics broken down by department. Only administrators can access this endpoint.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2026
 *         description: Filter by year
 *     responses:
 *       200:
 *         description: Leave statistics by department retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve leave statistics
 */
router.get(
    "/leaves/statistics/department",
    auth,
    admin,
    leaveController.getLeaveStatisticsByDepartment
);

/*
 * =========================================================
 * GET LEAVE DASHBOARD (ROLE-BASED)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/dashboard:
 *   get:
 *     summary: Get leave dashboard metrics
 *     description: Retrieve role-based leave dashboard metrics for Admin or Employee.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave dashboard metrics retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Employee profile not found
 *       500:
 *         description: Failed to retrieve leave dashboard
 */
router.get(
    "/leaves/dashboard",
    auth,
    leaveController.getLeaveDashboard
);

/*
 * =========================================================
 * GET LEAVE BY ID
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     description: Retrieve a specific leave request by its MongoDB ObjectId.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the leave request
 *         example: 68b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Leave request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid leave ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Failed to retrieve leave request
 */
router.get(
    "/leaves/:id",
    auth,
    leaveController.getLeaveById
);

/*
 * =========================================================
 * CREATE LEAVE REQUEST (EMPLOYEE)
 * =========================================================
 */

/**
 * @swagger
 * /leaves:
 *   post:
 *     summary: Create a leave request
 *     description: Create a new leave request for the currently logged-in employee.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - fromDate
 *               - toDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum:
 *                   - Casual Leave
 *                   - Sick Leave
 *                   - Earned Leave
 *                   - Unpaid Leave
 *                   - Optional Holiday
 *                 example: Casual Leave
 *               fromDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-25
 *               toDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-27
 *               days:
 *                 type: number
 *                 description: Optional - will be calculated if not provided
 *                 example: 3
 *               reason:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 500
 *                 example: Personal work
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave:
 *                   $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Employee profile not found
 *       409:
 *         description: Overlapping leave request already exists
 *       500:
 *         description: Failed to create leave request
 */
router.post(
    "/leaves",
    auth,
    validateLeaveData,
    leaveController.createLeave
);

/*
 * =========================================================
 * UPDATE LEAVE REQUEST (EMPLOYEE - PENDING ONLY)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}:
 *   put:
 *     summary: Update a leave request
 *     description: Update a pending leave request. Employees can update their own pending requests.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the leave request
 *         example: 68b123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - fromDate
 *               - toDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum:
 *                   - Casual Leave
 *                   - Sick Leave
 *                   - Earned Leave
 *                   - Unpaid Leave
 *                   - Optional Holiday
 *                 example: Sick Leave
 *               fromDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-25
 *               toDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-27
 *               days:
 *                 type: number
 *                 description: Optional - will be calculated if not provided
 *                 example: 3
 *               reason:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 500
 *                 example: Medical appointment
 *     responses:
 *       200:
 *         description: Leave request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave:
 *                   $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid leave ID or validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied or leave cannot be updated
 *       404:
 *         description: Leave request not found
 *       409:
 *         description: Overlapping leave request already exists
 *       500:
 *         description: Failed to update leave request
 */
router.put(
    "/leaves/:id",
    auth,
    validateLeaveData,
    leaveController.updateLeave
);

/*
 * =========================================================
 * CANCEL LEAVE REQUEST (EMPLOYEE)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}/cancel:
 *   patch:
 *     summary: Cancel a leave request
 *     description: Cancel the currently logged-in employee's pending leave request.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the leave request
 *         example: 68b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Leave request cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave:
 *                   $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid leave ID or leave cannot be cancelled
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You can only cancel your own leave request
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Failed to cancel leave request
 */
router.patch(
    "/leaves/:id/cancel",
    auth,
    leaveController.cancelLeave
);

/*
 * =========================================================
 * APPROVE LEAVE (ADMIN)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}/approve:
 *   patch:
 *     summary: Approve a leave request
 *     description: Approve a pending leave request. Only administrators can approve leave requests.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the leave request
 *         example: 68b123456789abcdef123456
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminRemark:
 *                 type: string
 *                 maxLength: 500
 *                 example: Approved for the requested dates
 *     responses:
 *       200:
 *         description: Leave request approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave:
 *                   $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid leave ID or leave cannot be approved
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Leave request not found
 *       409:
 *         description: Leave conflicts with another pending or approved leave
 *       500:
 *         description: Failed to approve leave request
 */
router.patch(
    "/leaves/:id/approve",
    auth,
    admin,
    leaveController.approveLeave
);

/*
 * =========================================================
 * REJECT LEAVE (ADMIN)
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}/reject:
 *   patch:
 *     summary: Reject a leave request
 *     description: Reject a pending leave request. Only administrators can reject leave requests.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the leave request
 *         example: 68b123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 500
 *                 example: Leave cannot be approved due to project deadline
 *     responses:
 *       200:
 *         description: Leave request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave:
 *                   $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid leave ID or rejection reason
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Failed to reject leave request
 */
router.patch(
    "/leaves/:id/reject",
    auth,
    admin,
    leaveController.rejectLeave
);

/*
 * =========================================================
 * ADMIN CANCEL LEAVE
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}/admin-cancel:
 *   patch:
 *     summary: Cancel a leave request (Admin)
 *     description: Cancel a pending or approved leave request. Only administrators can perform this action.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminRemark:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Leave request cancelled successfully
 *       400:
 *         description: Invalid leave ID or leave cannot be cancelled
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Failed to cancel leave request
 */
router.patch(
    "/leaves/:id/admin-cancel",
    auth,
    admin,
    leaveController.adminCancelLeave
);

/*
 * =========================================================
 * DELETE LEAVE (ADMIN)
 * =========================================================
 */


/**
 * @swagger
 * /leaves/{id}:
 *   delete:
 *     summary: Permanently delete a leave record
 *     description: |
 *       Permanently deletes a leave record from the database.
 *       This action is restricted to Admin users and is allowed
 *       only for leave records with Cancelled or Rejected status.
 *     tags:
 *       - Leave Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the leave record
 *         example: 66c8a9f5e1234567890abcd
 *     responses:
 *       200:
 *         description: Leave record permanently deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave record permanently deleted
 *       400:
 *         description: Invalid ID or leave status does not allow deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Only cancelled or rejected leave records can be permanently deleted
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Leave request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave request not found
 *       500:
 *         description: Server error
 */
router.delete(
    "/leaves/:id",
    auth,
    admin,
    leaveController.deleteLeave
);

/*
 * =========================================================
 * SWAGGER SCHEMA DEFINITIONS
 * =========================================================
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Leave:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68b123456789abcdef123456
 *         employee:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             employeeId:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             department:
 *               type: string
 *             designation:
 *               type: string
 *         leaveType:
 *           type: string
 *           enum:
 *             - Casual Leave
 *             - Sick Leave
 *             - Earned Leave
 *             - Unpaid Leave
 *             - Optional Holiday
 *         fromDate:
 *           type: string
 *           format: date
 *         toDate:
 *           type: string
 *           format: date
 *         days:
 *           type: number
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum:
 *             - Pending
 *             - Approved
 *             - Rejected
 *             - Cancelled
 *         approvedBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *         adminRemark:
 *           type: string
 *           nullable: true
 *         cancelledBy:
 *           type: object
 *           nullable: true
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/*
 * =========================================================
 * EXPORT ROUTER
 * =========================================================
 */

module.exports = router;