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