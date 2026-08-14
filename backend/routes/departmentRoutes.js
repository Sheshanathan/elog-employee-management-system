const express = require("express");
const router = express.Router();

const departmentController = require("../controllers/departmentController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags:
 *       - Departments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department list retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to retrieve departments
 */
router.get(
    "/departments",
    auth,
    departmentController.getDepartments
);


/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags:
 *       - Departments
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
 *         description: Department retrieved successfully
 *       400:
 *         description: Invalid department ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to retrieve department
 */
router.get(
    "/departments/:id",
    auth,
    departmentController.getDepartmentById
);


/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags:
 *       - Departments
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
 *                 example: Information Technology
 *               description:
 *                 type: string
 *                 example: Technology and software development department
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Department already exists
 *       500:
 *         description: Failed to create department
 */
router.post(
    "/departments",
    auth,
    admin,
    departmentController.createDepartment
);


/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update department
 *     tags:
 *       - Departments
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Information Technology
 *               description:
 *                 type: string
 *                 example: Technology and software development department
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       400:
 *         description: Invalid department ID or validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Department not found
 *       409:
 *         description: Department already exists
 *       500:
 *         description: Failed to update department
 */
router.put(
    "/departments/:id",
    auth,
    admin,
    departmentController.updateDepartment
);


/**
 * @swagger
 * /departments/{id}/status:
 *   patch:
 *     summary: Activate or deactivate department
 *     tags:
 *       - Departments
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
 *         description: Department status updated successfully
 *       400:
 *         description: Invalid department ID or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to update department status
 */
router.patch(
    "/departments/:id/status",
    auth,
    admin,
    departmentController.updateDepartmentStatus
);


/**
 * @swagger
 * /departments/{id}/employees:
 *   get:
 *     summary: Get employees in a department
 *     tags:
 *       - Departments
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
 *         description: Department employees retrieved successfully
 *       400:
 *         description: Invalid department ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to retrieve department employees
 */
router.get(
    "/departments/:id/employees",
    auth,
    departmentController.getDepartmentEmployees
);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags:
 *       - Departments
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
 *         description: Department deleted successfully
 *       400:
 *         description: Invalid department ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Department not found
 *       409:
 *         description: Department cannot be deleted because employees are assigned
 *       500:
 *         description: Failed to delete department
 */
router.delete(
    "/departments/:id",
    auth,
    admin,
    departmentController.deleteDepartment
);
module.exports = router;