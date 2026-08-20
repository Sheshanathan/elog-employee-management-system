const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const leaveController = require("../controllers/leaveController");

const {
    validateLeaveData
} = require("../middleware/validation");
console.log("auth:", typeof auth);
console.log("validateLeaveData:", typeof validateLeaveData);
console.log("createLeave:", typeof leaveController.createLeave);

/*
 * =========================================================
 * GET ALL LEAVES
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
 *         description: Filter leave requests by employee ID
 *       - in: query
 *         name: leaveType
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - Casual
 *             - Sick
 *             - Earned
 *             - Maternity
 *             - Paternity
 *             - Unpaid
 *             - Other
 *         description: Filter leave requests by leave type
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
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
 * GET MY LEAVES
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
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employee access required
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
 *         example: 68b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Leave request retrieved successfully
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
 * CREATE LEAVE REQUEST
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
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum:
 *                   - Casual
 *                   - Sick
 *                   - Earned
 *                   - Maternity
 *                   - Paternity
 *                   - Unpaid
 *                   - Other
 *                 example: Casual
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-25
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-27
 *               reason:
 *                 type: string
 *                 example: Personal work
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employee access required
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
 * UPDATE LEAVE REQUEST
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
 *         example: 68b123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum:
 *                   - Casual
 *                   - Sick
 *                   - Earned
 *                   - Maternity
 *                   - Paternity
 *                   - Unpaid
 *                   - Other
 *                 example: Sick
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-25
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-27
 *               reason:
 *                 type: string
 *                 example: Medical appointment
 *     responses:
 *       200:
 *         description: Leave request updated successfully
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
 * CANCEL MY LEAVE
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}/cancel:
 *   patch:
 *     summary: Cancel a leave request
 *     description: Cancel the currently logged-in employee's pending or approved leave request.
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
 *         example: 68b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Leave request cancelled successfully
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
 * APPROVE LEAVE
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
 *         example: 68b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Leave request approved successfully
 *       400:
 *         description: Invalid leave ID or leave cannot be approved
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Leave request not found
 *       409:
 *         description: Leave conflicts with another approved leave
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
 * REJECT LEAVE
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
 *                 example: Leave cannot be approved due to project deadline
 *     responses:
 *       200:
 *         description: Leave request rejected successfully
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
 * DELETE LEAVE
 * =========================================================
 */

/**
 * @swagger
 * /leaves/{id}:
 *   delete:
 *     summary: Delete a leave request
 *     description: Delete a leave request. Only administrators can permanently delete leave records.
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
 *         example: 68b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Leave request deleted successfully
 *       400:
 *         description: Invalid leave ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Failed to delete leave request
 */
router.delete(
    "/leaves/:id",
    auth,
    admin,
    leaveController.deleteLeave
);


/*
 * =========================================================
 * LEAVE BALANCE
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 casual:
 *                   type: number
 *                   example: 10
 *                 sick:
 *                   type: number
 *                   example: 8
 *                 earned:
 *                   type: number
 *                   example: 12
 *                 unpaid:
 *                   type: number
 *                   example: 0
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employee access required
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
 * ALL LEAVE BALANCES
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
 * LEAVE SUMMARY
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 pending:
 *                   type: integer
 *                   example: 5
 *                 approved:
 *                   type: integer
 *                   example: 15
 *                 rejected:
 *                   type: integer
 *                   example: 3
 *                 cancelled:
 *                   type: integer
 *                   example: 2
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
 * EXPORT ROUTER
 * =========================================================
 */

module.exports = router;