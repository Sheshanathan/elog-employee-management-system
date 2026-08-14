const Department = require("../models/Department");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const { EMPLOYEE_POPULATES } = require("../utils/employeeHelpers");

// Get all departments
async function getDepartments(req, res) {
    try {
        const departments = await Department.find().sort({ name: 1 });

        res.status(200).json(departments);
    } catch (error) {
        console.error("Get Departments Error:", error);

        res.status(500).json({
            message: "Failed to retrieve departments"
        });
    }
}


// Get department by ID
async function getDepartmentById(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Department ID"
            });
        }

        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department Not Found"
            });
        }

        res.status(200).json(department);
    } catch (error) {
        console.error("Get Department Error:", error);

        res.status(500).json({
            message: "Failed to retrieve department"
        });
    }
}


// Create department
async function createDepartment(req, res) {
    try {
        const {
            name,
            description,
            status
        } = req.body;

        const existingDepartment = await Department.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            }
        });

        if (existingDepartment) {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        const department = await Department.create({
            name,
            description,
            status
        });

        res.status(201).json({
            message: "Department Created Successfully",
            department
        });
    } catch (error) {
        console.error("Create Department Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach((field) => {
                errors[field] = error.errors[field].message;
            });

            return res.status(400).json({
                message: "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message: "Failed to create department"
        });
    }
}


// Update department
async function updateDepartment(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Department ID"
            });
        }

        const {
            name,
            description,
            status
        } = req.body;

        const existingDepartment = await Department.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            },
            _id: {
                $ne: req.params.id
            }
        });

        if (existingDepartment) {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                status
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!department) {
            return res.status(404).json({
                message: "Department Not Found"
            });
        }

        res.status(200).json({
            message: "Department Updated Successfully",
            department
        });
    } catch (error) {
        console.error("Update Department Error:", error);

        if (error.name === "ValidationError") {
            const errors = {};

            Object.keys(error.errors).forEach((field) => {
                errors[field] = error.errors[field].message;
            });

            return res.status(400).json({
                message: "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message: "Failed to update department"
        });
    }
}

// Delete department
async function deleteDepartment(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Department ID"
            });
        }

        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department Not Found"
            });
        }

        const employeeCount = await Employee.countDocuments({
            department: department._id
        });

        if (employeeCount > 0) {
            return res.status(409).json({
                message: `Cannot delete department because ${employeeCount} employee(s) are assigned to it. Deactivate the department instead.`
            });
        }

        await Department.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Department Deleted Successfully"
        });
    } catch (error) {
        console.error("Delete Department Error:", error);

        res.status(500).json({
            message: "Failed to delete department"
        });
    }
}

// Activate / deactivate department
async function updateDepartmentStatus(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Department ID"
            });
        }

        const { status } = req.body;

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Active or Inactive"
            });
        }

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            { status },
            {
                new: true,
                runValidators: true
            }
        );

        if (!department) {
            return res.status(404).json({
                message: "Department Not Found"
            });
        }

        res.status(200).json({
            message: `Department ${status} Successfully`,
            department
        });
    } catch (error) {
        console.error("Update Department Status Error:", error);

        res.status(500).json({
            message: "Failed to update department status"
        });
    }
}


// Get employees in a department
async function getDepartmentEmployees(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Department ID"
            });
        }

        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department Not Found"
            });
        }

        const employees = await Employee.find({
            department: department._id
        }).populate(EMPLOYEE_POPULATES);

        res.status(200).json(employees);
    } catch (error) {
        console.error("Get Department Employees Error:", error);

        res.status(500).json({
            message: "Failed to retrieve department employees"
        });
    }
}


module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    updateDepartmentStatus,
    getDepartmentEmployees,
    deleteDepartment
};