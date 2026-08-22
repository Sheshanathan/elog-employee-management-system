const User = require("../models/User");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const { EMPLOYEE_NESTED_POPULATE } = require("../utils/employeeHelpers");


/*
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
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


/*
 * =========================================================
 * GET USER BY ID
 * =========================================================
 */
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


/*
 * =========================================================
 * CREATE USER
 * =========================================================
 *
 * Employee name is NOT stored in User.
 * Employee record is selected and linked instead.
 */
exports.createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            employee
        } = req.body;

        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedName = typeof name === "string" ? name.trim() : "";

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        /*
         * Employee accounts must be linked
         * to an Employee record.
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
            name: role === "Admin" ? normalizedName : undefined,
            email: normalizedEmail,
            password: hashedPassword,
            role,
            employee:
                role === "Employee"
                    ? employee
                    : null
        });

        await user.save();

        await user.populate(EMPLOYEE_NESTED_POPULATE);

        res.status(201).json({
            message: "User Created Successfully",
            user
        });

    } catch (error) {
        console.error("Create User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Email or employee already exists"
            });
        }

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach((field) => {
                errors[field] =
                    error.errors[field].message;
            });

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


/*
 * =========================================================
 * UPDATE USER
 * =========================================================
 *
 * User editing is only for:
 * - Email
 * - Role
 * - Employee link
 *
 * Employee name is edited from Employee management.
 */
exports.updateUser = async (req, res) => {
    try {
        const {
            name,
            email,
            role,
            employee
        } = req.body;

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        const normalizedEmail =
            email?.trim().toLowerCase();
        const normalizedName = typeof name === "string" ? name.trim() : "";

        const emailExists = await User.findOne({
            email: normalizedEmail,
            _id: {
                $ne: id
            }
        });

        if (emailExists) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        let employeeId = null;

        /*
         * Employee role requires an Employee link.
         */
        if (role === "Employee") {

            employeeId =
                employee || existingUser.employee;

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
         * Admin does not need Employee link.
         */
        if (role === "Admin") {
            if (!normalizedName) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: { name: "Name is required for an Admin account" }
                });
            }
            employeeId = null;
        }

        const userUpdate = {
            email: normalizedEmail,
            role,
            employee: employeeId
        };

        if (role === "Admin") {
            userUpdate.name = normalizedName;
        } else {
            // Remove legacy duplicated names when an account is (or becomes)
            // employee-linked. Employee.name is the sole source of truth.
            userUpdate.$unset = { name: 1 };
        }

        const updatedUser =
            await User.findByIdAndUpdate(
                id,
                userUpdate,
                {
                    new: true,
                    runValidators: true
                }
            )
                .select("-password")
                .populate(EMPLOYEE_NESTED_POPULATE);

        res.status(200).json({
            message: "User Updated Successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Email or employee already exists"
            });
        }

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach((field) => {
                errors[field] =
                    error.errors[field].message;
            });

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


/*
 * =========================================================
 * DELETE USER
 * =========================================================
 */
exports.deleteUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        const user =
            await User.findByIdAndDelete(req.params.id);

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
 *
 * IMPORTANT:
 * Employee name comes from Employee record.
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
 * =========================================================
 *
 * Employee:
 * - name comes from Employee record
 * - email belongs to User
 * - phone belongs to User
 *
 * Admin:
 * - name, email and phone belong to User
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

        const existingUser =
            await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        /*
         * -------------------------------------------------
         * EMAIL
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
         * PHONE
         * -------------------------------------------------
         */
        let normalizedPhone = "";

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
        }

        /*
         * -------------------------------------------------
         * DUPLICATE EMAIL
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
         * Employee names are stored only in Employee. Admin names are stored
         * only in User, so neither account type has a second mutable name.
         */
        if (existingUser.role === "Employee") {

            if (!existingUser.employee) {
                return res.status(400).json({
                    message:
                        "Your account is not linked to an employee"
                });
            }

            if (!name || !name.trim()) {
                return res.status(400).json({
                    message: "Name is required",
                    errors: {
                        name: "Name is required"
                    }
                });
            }

            const normalizedName =
                name.trim();

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

            const updatedEmployee = await Employee.findByIdAndUpdate(
                existingUser.employee,
                {
                    name: normalizedName
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedEmployee) {
                return res.status(404).json({
                    message: "Employee profile not found"
                });
            }
        } else {
            if (!name || !name.trim()) {
                return res.status(400).json({
                    message: "Name is required",
                    errors: { name: "Name is required" }
                });
            }

            const normalizedName = name.trim();

            if (normalizedName.length < 2 || normalizedName.length > 50) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: { name: "Name must contain between 2 and 50 characters" }
                });
            }

            if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(normalizedName)) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: { name: "Name should contain only letters and spaces" }
                });
            }

            existingUser.name = normalizedName;
        }

        /*
         * -------------------------------------------------
         * UPDATE USER ACCOUNT FIELDS
         * -------------------------------------------------
         */
        const updatedUser =
            await User.findByIdAndUpdate(
                userId,
                {
                    ...(existingUser.role === "Admin" && {
                        name: existingUser.name
                    }),
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

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Email already exists"
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
