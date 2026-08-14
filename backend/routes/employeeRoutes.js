const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");

const {
    validateEmployeeData
} = require("../middleware/validation");


/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee list retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to retrieve employees
 */
router.get(
    "/employees",
    auth,
    admin,
    employeeController.getEmployees
);

router.get("/employees/my/profile", auth, employeeController.getMyProfile);
router.patch("/employees/my/profile", auth, employeeController.updateMyProfile);


/**
 * @swagger
 * /employees/department-report:
 *   get:
 *     summary: Get employee department report
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                     example: IT
 *                   totalEmployees:
 *                     type: integer
 *                     example: 10
 *                   averageSalary:
 *                     type: number
 *                     example: 45000
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to generate department report
 */
router.get(
    "/employees/department-report",
    auth,
    admin,
    employeeController.departmentReport
);


/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags:
 *       - Employees
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
 *         description: Employee retrieved successfully
 *       400:
 *         description: Invalid employee ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Failed to retrieve employee
 */
router.get(
    "/employees/:id",
    auth,
    admin,
    employeeController.getEmployeeById
);


/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Add a new employee
 *     tags:
 *       - Employees
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
 *               - department
 *               - designation
 *               - salary
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               department:
 *                 type: string
 *                 description: Department ObjectId
 *                 example: 68b123456789abcdef123456
 *               designation:
 *                 type: string
 *                 description: Designation ObjectId
 *                 example: 68b123456789abcdef123456
 *               joiningDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-07
 *               salary:
 *                 type: number
 *                 example: 45000
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Employee already exists
 *       500:
 *         description: Failed to create employee
 */
router.post(
    "/employees",
    auth,
    admin,
    validateEmployeeData,
    employeeController.addEmployee
);


/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags:
 *       - Employees
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
 *               - department
 *               - designation
 *               - salary
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               department:
 *                 type: string
 *                 description: Department ObjectId
 *                 example: 68b123456789abcdef123456
 *               designation:
 *                 type: string
 *                 description: Designation ObjectId
 *                 example: 68b123456789abcdef123456
 *               joiningDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-07
 *               salary:
 *                 type: number
 *                 example: 55000
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       400:
 *         description: Invalid employee ID or validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Failed to update employee
 */
router.put(
    "/employees/:id",
    auth,
    admin,
    validateEmployeeData,
    employeeController.updateEmployee
);


/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags:
 *       - Employees
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
 *         description: Employee deleted successfully
 *       400:
 *         description: Invalid employee ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Failed to delete employee
 */
router.delete(
    "/employees/:id",
    auth,
    admin,
    employeeController.deleteEmployee
);


/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload employee image
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No image file uploaded
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to upload image
 */
router.post(
    "/upload",
    auth,
    admin,
    upload.single("image"),
    employeeController.uploadImage
);


/**
 * @swagger
 * /send-mail:
 *   post:
 *     summary: Send welcome email
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: employee@example.com
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Email is required
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to send email
 */
router.post(
    "/send-mail",
    auth,
    admin,
    employeeController.sendMail
);


module.exports = router;
