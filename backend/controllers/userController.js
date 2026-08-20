const User = require("../models/User");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const { EMPLOYEE_NESTED_POPULATE } = require("../utils/employeeHelpers");

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate(EMPLOYEE_NESTED_POPULATE);

        res.status(200).json(users);

    } catch (error) {
        console.error("Get Users Error:", error);

        res.status(500).json({
            message: "Failed to retrieve users"
        });
    }
};


exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        const user = await User.findById(id)
            .select("-password")
            .populate(EMPLOYEE_NESTED_POPULATE);

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("Get User By ID Error:", error);

        res.status(500).json({
            message: "Failed to retrieve user"
        });
    }
};


exports.createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            employee
        } = req.body;

        const normalizedEmail =
            email?.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        /*
         * Employee role requires an employee
         */
        if (role === "Employee") {

            if (!employee) {
                return res.status(400).json({
                    message:
                        "Employee selection is required for Employee role"
                });
            }

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

            const existingEmployeeUser =
                await User.findOne({
                    employee
                });

            if (existingEmployeeUser) {
                return res.status(409).json({
                    message:
                        "This employee already has a user account"
                });
            }
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role,
            employee:
                role === "Employee"
                    ? employee
                    : null
        });

        await user.save();

        res.status(201).json({
            message: "User Created Successfully"
        });

    } catch (error) {

        console.error("Create User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists"
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
            message: "Failed to create user"
        });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const {
            name,
            email,
            role,
            employee
        } = req.body;

        const { id } = req.params;

        // Validate User ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        // Find the existing user first
        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        // Check duplicate email
        const emailExists = await User.findOne({
            email: email.toLowerCase(),
            _id: {
                $ne: id
            }
        });

        if (emailExists) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        /*
         * Employee role
         *
         * If frontend sends a new employee,
         * validate it.
         *
         * If frontend does not send employee,
         * preserve the existing employee.
         */
        let employeeId = null;

        if (role === "Employee") {

            employeeId = employee || existingUser.employee;

            if (!employeeId) {
                return res.status(400).json({
                    message:
                        "Employee selection is required for Employee role"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    message: "Invalid Employee ID"
                });
            }

            const employeeExists =
                await Employee.findById(employeeId);

            if (!employeeExists) {
                return res.status(404).json({
                    message: "Employee Not Found"
                });
            }

            // Check whether another user already uses this employee
            const existingEmployeeUser =
                await User.findOne({
                    employee: employeeId,
                    _id: {
                        $ne: id
                    }
                });

            if (existingEmployeeUser) {
                return res.status(409).json({
                    message:
                        "This employee already has a user account"
                });
            }
        }

        /*
         * Admin users do not need an employee.
         */
        if (role === "Admin") {
            employeeId = null;
        }

        // Update user
        const updatedUser =
            await User.findByIdAndUpdate(
                id,
                {
                    name,
                    email: email.toLowerCase(),
                    role,
                    employee: employeeId
                },
                {
                    new: true,
                    runValidators: true
                }
            ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        res.status(200).json({
            message: "User Updated Successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or employee already exists"
            });
        }

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach((field) => {
                errors[field] =
                    error.errors[field].message;
            });

            console.error(
                "Validation Errors:",
                errors
            );

            return res.status(400).json({
                message: "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message: "Failed to update user"
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        const user =
            await User.findByIdAndDelete(
                req.params.id
            );

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        res.status(200).json({
            message: "User Deleted Successfully"
        });

    } catch (error) {

        console.error("Delete User Error:", error);

        res.status(500).json({
            message: "Failed to delete user"
        });
    }
};

/*
 * =========================================================
 * GET MY PROFILE
 * =========================================================
 */
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        const user = await User.findById(userId)
            .select("-password")
            .populate(EMPLOYEE_NESTED_POPULATE);

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error(
            "Get My Profile Error:",
            error
        );

        res.status(500).json({
            message: "Failed to retrieve profile"
        });
    }
};


/*
 * =========================================================
 * UPDATE MY PROFILE
 *
 * Allows logged-in Admin/Employee to update:
 * - Name
 * - Email
 * - Phone
 *
 * Does NOT allow:
 * - Password
 * - Role
 * - Employee assignment
 * - Account status
 * =========================================================
 */
exports.updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        const {
            name,
            email,
            phone
        } = req.body;

        /*
         * Find current user
         */
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        /*
         * -------------------------------------------------
         * NAME VALIDATION
         * -------------------------------------------------
         */
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Name is required",
                errors: {
                    name: "Name is required"
                }
            });
        }

        const normalizedName = name.trim();

        if (normalizedName.length < 2) {
            return res.status(400).json({
                message: "Validation failed",
                errors: {
                    name:
                        "Name must contain at least 2 characters"
                }
            });
        }

        if (normalizedName.length > 50) {
            return res.status(400).json({
                message: "Validation failed",
                errors: {
                    name:
                        "Name cannot exceed 50 characters"
                }
            });
        }

        if (
            !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                normalizedName
            )
        ) {
            return res.status(400).json({
                message: "Validation failed",
                errors: {
                    name:
                        "Name should contain only letters and spaces"
                }
            });
        }

        /*
         * -------------------------------------------------
         * EMAIL VALIDATION
         * -------------------------------------------------
         */
        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Email is required",
                errors: {
                    email: "Email is required"
                }
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        if (
            !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
                normalizedEmail
            )
        ) {
            return res.status(400).json({
                message: "Validation failed",
                errors: {
                    email:
                        "Enter a valid email address"
                }
            });
        }

        /*
         * -------------------------------------------------
         * PHONE VALIDATION
         * -------------------------------------------------
         *
         * Phone is optional.
         */
        let normalizedPhone;

        if (
            phone !== undefined &&
            phone !== null &&
            phone.trim() !== ""
        ) {
            normalizedPhone = phone.trim();

            if (
                !/^[0-9+()\-\s]{7,20}$/.test(
                    normalizedPhone
                )
            ) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: {
                        phone:
                            "Enter a valid phone number"
                    }
                });
            }
        } else {
            normalizedPhone = "";
        }

        /*
         * -------------------------------------------------
         * DUPLICATE EMAIL CHECK
         * -------------------------------------------------
         */
        const emailExists = await User.findOne({
            email: normalizedEmail,
            _id: {
                $ne: userId
            }
        });

        if (emailExists) {
            return res.status(409).json({
                message: "Email already exists",
                errors: {
                    email:
                        "Email already exists"
                }
            });
        }

        /*
         * -------------------------------------------------
         * UPDATE ONLY PROFILE FIELDS
         * -------------------------------------------------
         */
        const updatedUser =
            await User.findByIdAndUpdate(
                userId,
                {
                    name: normalizedName,
                    email: normalizedEmail,
                    phone: normalizedPhone
                },
                {
                    new: true,
                    runValidators: true
                }
            )
                .select("-password")
                .populate(
                    EMPLOYEE_NESTED_POPULATE
                );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        /*
         * -------------------------------------------------
         * RESPONSE
         * -------------------------------------------------
         */
        res.status(200).json({
            message:
                "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error(
            "Update My Profile Error:",
            error
        );

        /*
         * Duplicate key
         */
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Email already exists",
                errors: {
                    email:
                        "Email already exists"
                }
            });
        }

        /*
         * Mongoose validation
         */
        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach(
                (field) => {
                    errors[field] =
                        error.errors[field].message;
                }
            );

            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message:
                "Failed to update profile"
        });
    }
};