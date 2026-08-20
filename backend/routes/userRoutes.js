const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const userController = require("../controllers/userController");

const {
    validateUserData,
    validateLogin,
    validateForgotPassword,
    validateResetPassword
} = require("../middleware/validation");


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to retrieve users
 */
router.get(
    "/users",
    auth,
    admin,
    userController.getUsers
);

/**
  * @swagger
  * /users/{id}:
  *   get:
  *     summary: Get a user by ID
  *     tags:
  *       - Users
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
  *         description: User retrieved successfully
  *       400:
  *         description: Invalid user ID
  *       401:
  *         description: Authentication required
  *       403:
  *         description: Admin access required
  *       404:
  *         description: User not found
  *       500:
  *         description: Failed to retrieve user
  */
router.get(
    "/users/:id",
    auth,
    admin,
    userController.getUserById
);
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
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
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               role:
 *                 type: string
 *                 enum:
 *                   - Employee
 *                   - Admin
 *                 example: Employee
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Failed to create user
 */
router.post(
    "/users",
    auth,
    admin,
    validateUserData,
    userController.createUser
);


/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags:
 *       - Users
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
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 enum:
 *                   - Employee
 *                   - Admin
 *                 example: Employee
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid user ID or validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Failed to update user
 */
router.put(
    "/users/:id",
    auth,
    admin,
    validateUserData,
    userController.updateUser
);


/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - Users
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
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
router.delete(
    "/users/:id",
    auth,
    admin,
    userController.deleteUser
);

/*
 * =========================================================
 * MY PROFILE
 * =========================================================
 */

/**
 * @swagger
 * /users/my/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve profile
 */
router.get(
    "/users/my/profile",
    auth,
    userController.getMyProfile
);


/**
 * @swagger
 * /users/my/profile:
 *   patch:
 *     summary: Update logged-in user's profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Failed to update profile
 */
router.patch(
    "/users/my/profile",
    auth,
    userController.updateMyProfile
);


module.exports = router;

module.exports = router;