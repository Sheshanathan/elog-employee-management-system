const Designation = require("../models/Designation");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const { EMPLOYEE_POPULATES } = require("../utils/employeeHelpers");


// Get all designations
async function getDesignations(req, res) {
    try {
        const designations = await Designation.find().sort({ name: 1 });

        res.status(200).json(designations);
    } catch (error) {
        console.error("Get Designations Error:", error);

        res.status(500).json({
            message: "Failed to retrieve designations"
        });
    }
}


// Get designation by ID
async function getDesignationById(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Designation ID"
            });
        }

        const designation = await Designation.findById(req.params.id);

        if (!designation) {
            return res.status(404).json({
                message: "Designation Not Found"
            });
        }

        res.status(200).json(designation);
    } catch (error) {
        console.error("Get Designation Error:", error);

        res.status(500).json({
            message: "Failed to retrieve designation"
        });
    }
}


// Create designation
async function createDesignation(req, res) {
    try {
        const {
            name,
            description,
            status
        } = req.body;

        const existingDesignation = await Designation.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            }
        });

        if (existingDesignation) {
            return res.status(409).json({
                message: "Designation already exists"
            });
        }

        const designation = await Designation.create({
            name,
            description,
            status
        });

        res.status(201).json({
            message: "Designation Created Successfully",
            designation
        });
    } catch (error) {
        console.error("Create Designation Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Designation already exists"
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
            message: "Failed to create designation"
        });
    }
}


// Update designation
async function updateDesignation(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Designation ID"
            });
        }

        const {
            name,
            description,
            status
        } = req.body;

        const existingDesignation = await Designation.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            },
            _id: {
                $ne: req.params.id
            }
        });

        if (existingDesignation) {
            return res.status(409).json({
                message: "Designation already exists"
            });
        }

        const designation = await Designation.findByIdAndUpdate(
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

        if (!designation) {
            return res.status(404).json({
                message: "Designation Not Found"
            });
        }

        res.status(200).json({
            message: "Designation Updated Successfully",
            designation
        });
    } catch (error) {
        console.error("Update Designation Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Designation already exists"
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
            message: "Failed to update designation"
        });
    }
}


// Activate / deactivate designation
async function updateDesignationStatus(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Designation ID"
            });
        }

        const { status } = req.body;

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Active or Inactive"
            });
        }

        const designation = await Designation.findByIdAndUpdate(
            req.params.id,
            { status },
            {
                new: true,
                runValidators: true
            }
        );

        if (!designation) {
            return res.status(404).json({
                message: "Designation Not Found"
            });
        }

        res.status(200).json({
            message: `Designation ${status} Successfully`,
            designation
        });
    } catch (error) {
        console.error("Update Designation Status Error:", error);

        res.status(500).json({
            message: "Failed to update designation status"
        });
    }
}


// Get employees with a designation
async function getDesignationEmployees(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Designation ID"
            });
        }

        const designation = await Designation.findById(req.params.id);

        if (!designation) {
            return res.status(404).json({
                message: "Designation Not Found"
            });
        }

        const employees = await Employee.find({
            designation: designation._id
        }).populate(EMPLOYEE_POPULATES);

        res.status(200).json(employees);
    } catch (error) {
        console.error("Get Designation Employees Error:", error);

        res.status(500).json({
            message: "Failed to retrieve designation employees"
        });
    }
}


// Delete designation only if no employees use it
async function deleteDesignation(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Designation ID"
            });
        }

        const designation = await Designation.findById(req.params.id);

        if (!designation) {
            return res.status(404).json({
                message: "Designation Not Found"
            });
        }

        const employeeExists = await Employee.exists({
            designation: designation._id
        });

        if (employeeExists) {
            return res.status(409).json({
                message:
                    "Designation cannot be deleted because employees are assigned to it. Deactivate it instead."
            });
        }

        await Designation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Designation Deleted Successfully"
        });
    } catch (error) {
        console.error("Delete Designation Error:", error);

        res.status(500).json({
            message: "Failed to delete designation"
        });
    }
}


module.exports = {
    getDesignations,
    getDesignationById,
    createDesignation,
    updateDesignation,
    updateDesignationStatus,
    getDesignationEmployees,
    deleteDesignation
};