const express = require("express");
const router = express.Router();

const designationController = require("../controllers/designationController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


/**
 * @swagger
 * /designations:
 *   get:
 *     summary: Get all designations
 *     tags:
 *       - Designations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Designation list retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to retrieve designations
 */
router.get(
    "/designations",
    auth,
    designationController.getDesignations
);


/**
 * @swagger
 * /designations/{id}:
 *   get:
 *     summary: Get designation by ID
 *     tags:
 *       - Designations
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
 *         description: Designation retrieved successfully
 *       400:
 *         description: Invalid designation ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Designation not found
 *       500:
 *         description: Failed to retrieve designation
 */
router.get(
    "/designations/:id",
    auth,
    designationController.getDesignationById
);


/**
 * @swagger
 * /designations:
 *   post:
 *     summary: Create designation
 *     tags:
 *       - Designations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Software Developer
 *               description:
 *                 type: string
 *                 example: Develops and maintains software applications
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Designation created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Designation already exists
 *       500:
 *         description: Failed to create designation
 */
router.post(
    "/designations",
    auth,
    admin,
    designationController.createDesignation
);


/**
 * @swagger
 * /designations/{id}:
 *   put:
 *     summary: Update designation
 *     tags:
 *       - Designations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senior Software Developer
 *               description:
 *                 type: string
 *                 example: Senior software development role
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: Designation updated successfully
 *       400:
 *         description: Invalid ID or validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Designation not found
 *       409:
 *         description: Designation already exists
 *       500:
 *         description: Failed to update designation
 */
router.put(
    "/designations/:id",
    auth,
    admin,
    designationController.updateDesignation
);


/**
 * @swagger
 * /designations/{id}/status:
 *   patch:
 *     summary: Activate or deactivate designation
 *     tags:
 *       - Designations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Inactive
 *     responses:
 *       200:
 *         description: Designation status updated successfully
 *       400:
 *         description: Invalid ID or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Designation not found
 *       500:
 *         description: Failed to update designation status
 */
router.patch(
    "/designations/:id/status",
    auth,
    admin,
    designationController.updateDesignationStatus
);


/**
 * @swagger
 * /designations/{id}/employees:
 *   get:
 *     summary: Get employees with a designation
 *     tags:
 *       - Designations
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
 *         description: Employees retrieved successfully
 *       400:
 *         description: Invalid designation ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Designation not found
 *       500:
 *         description: Failed to retrieve employees
 */
router.get(
    "/designations/:id/employees",
    auth,
    designationController.getDesignationEmployees
);


/**
 * @swagger
 * /designations/{id}:
 *   delete:
 *     summary: Delete designation if no employees are assigned
 *     tags:
 *       - Designations
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
 *         description: Designation deleted successfully
 *       400:
 *         description: Invalid designation ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Designation not found
 *       409:
 *         description: Employees are assigned to this designation
 *       500:
 *         description: Failed to delete designation
 */
router.delete(
    "/designations/:id",
    auth,
    admin,
    designationController.deleteDesignation
);


module.exports = router;