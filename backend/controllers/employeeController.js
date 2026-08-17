const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const transporter = require("../config/mail");
const User = require("../models/User");
const { validateDepartmentAssignment } = require("../utils/departmentHelpers");
const { validateDesignationAssignment } = require("../utils/designationHelpers");
const { EMPLOYEE_POPULATES } = require("../utils/employeeHelpers");
const Department = require("../models/Department");
const Designation = require("../models/Designation");

async function getEmployees(req, res) {
    try {
        const filter = {};

        if (req.query.name) {
            filter.name = {
                $regex: req.query.name,
                $options: "i"
            };
        }

        const employees = await Employee.find(filter).populate(EMPLOYEE_POPULATES);

        res.status(200).json(employees);

    } catch (error) {
        console.error("Get Employees Error:", error);

        res.status(500).json({
            message: "Failed to retrieve employees"
        });
    }
}

async function getMyProfile(req, res) {
    try {
        const user = await User.findById(req.user.id).select("employee role isActive");
        if (!user) return res.status(404).json({ message: "User Not Found" });
        if (user.role !== "Employee") return res.status(403).json({ message: "Employee access required" });
        if (!user.employee) return res.status(400).json({ message: "No employee profile is linked to this account" });
        const employee = await Employee.findById(user.employee).select("-salary").populate(EMPLOYEE_POPULATES);
        if (!employee) return res.status(404).json({ message: "Employee Not Found" });
        res.json(employee);
    } catch { res.status(500).json({ message: "Failed to retrieve profile" }); }
}

async function updateMyProfile(req, res) {
    try {
        const user = await User.findById(req.user.id).select("employee role");
        if (!user || user.role !== "Employee" || !user.employee) return res.status(403).json({ message: "Employee access required" });
        const { name, email, phone } = req.body;
        const employee = await Employee.findByIdAndUpdate(user.employee, { name, email, phone }, { new: true, runValidators: true }).select("-salary").populate(EMPLOYEE_POPULATES);
        res.json({ message: "Profile updated successfully", employee });
    } catch (error) { res.status(error.name === "ValidationError" ? 400 : 500).json({ message: error.name === "ValidationError" ? "Validation failed" : "Failed to update profile" }); }
}


async function addEmployee(req, res) {
    try {
        const {
            name,
            salary,
            department,
            designation,
            joiningDate,
            status
        } = req.body;

        const departmentValidation = await validateDepartmentAssignment(department);

        if (!departmentValidation.valid) {
            return res.status(departmentValidation.status).json({
                message: departmentValidation.message
            });
        }

        const designationValidation = await validateDesignationAssignment(designation);

        if (!designationValidation.valid) {
            return res.status(designationValidation.status).json({
                message: designationValidation.message
            });
        }

        const lastEmployee = await Employee.findOne()
            .sort({ employeeId: -1 });

        let employeeNumber = 1;

        if (lastEmployee && lastEmployee.employeeId) {
            const lastNumber = parseInt(
                lastEmployee.employeeId.replace("EMP", "")
            );

            if (!isNaN(lastNumber)) {
                employeeNumber = lastNumber + 1;
            }
        }

        const employeeId =
            `EMP${String(employeeNumber).padStart(3, "0")}`;

        const employee = await Employee.create({
            employeeId,
            name,
            salary,
            department,
            designation,
            joiningDate,
            status
        });

        const populatedEmployee = await Employee.findById(employee._id).populate(EMPLOYEE_POPULATES);

        res.status(201).json({
            message: "Employee Created Successfully",
            employee: populatedEmployee
        });

    } catch (error) {
        console.error("Add Employee Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Employee ID already exists"
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
            message: "Failed to create employee"
        });
    }
}


async function getEmployeeById(req, res) {
    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const employee = await Employee.findById(req.params.id).populate(EMPLOYEE_POPULATES);

        if (!employee) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        res.status(200).json(employee);

    } catch (error) {
        console.error("Get Employee Error:", error);

        res.status(500).json({
            message: "Failed to retrieve employee"
        });
    }
}


async function updateEmployee(req, res) {
    try {
        const {
            name,
            salary,
            department,
            designation,
            joiningDate,
            status
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const existingEmployee = await Employee.findById(req.params.id);

        if (!existingEmployee) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        const isSameDepartment =
            existingEmployee.department &&
            String(existingEmployee.department) === String(department);

        const departmentValidation = await validateDepartmentAssignment(department, {
            allowInactive: isSameDepartment
        });

        if (!departmentValidation.valid) {
            return res.status(departmentValidation.status).json({
                message: departmentValidation.message
            });
        }

        const isSameDesignation =
            existingEmployee.designation &&
            String(existingEmployee.designation) === String(designation);

        const designationValidation = await validateDesignationAssignment(designation, {
            allowInactive: isSameDesignation
        });

        if (!designationValidation.valid) {
            return res.status(designationValidation.status).json({
                message: designationValidation.message
            });
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                name,
                salary,
                department,
                designation,
                joiningDate,
                status
            },
            {
                new: true,
                runValidators: true
            }
        ).populate(EMPLOYEE_POPULATES);

        res.status(200).json({
            message: "Employee Updated Successfully",
            employee
        });

    } catch (error) {
        console.error("Update Employee Error:", error);

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
            message: "Failed to update employee"
        });
    }
}


async function deleteEmployee(req, res) {
    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const employee = await Employee.findByIdAndDelete(
            req.params.id
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        res.status(200).json({
            message: "Employee Deleted Successfully"
        });

    } catch (error) {
        console.error("Delete Employee Error:", error);

        res.status(500).json({
            message: "Failed to delete employee"
        });
    }
}


async function uploadImage(req, res) {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No image file uploaded"
            });
        }

        res.status(200).json({
            message: "File Uploaded Successfully",
            file: req.file
        });

    } catch (error) {
        console.error("Upload Image Error:", error);

        res.status(500).json({
            message: "Failed to upload image"
        });
    }
}


async function departmentReport(req, res) {
    try {

        const report = await Employee.aggregate([
            {
                $lookup: {
                    from: "departments",
                    localField: "department",
                    foreignField: "_id",
                    as: "departmentInfo"
                }
            },
            {
                $unwind: {
                    path: "$departmentInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$departmentInfo._id",
                    department: {
                        $first: "$departmentInfo.name"
                    },
                    totalEmployees: {
                        $sum: 1
                    },
                    averageSalary: {
                        $avg: "$salary"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    department: {
                        $ifNull: ["$department", "Unassigned"]
                    },
                    totalEmployees: 1,
                    averageSalary: {
                        $round: ["$averageSalary", 0]
                    }
                }
            },
            {
                $sort: {
                    department: 1
                }
            }
        ]);

        res.status(200).json(report);

    } catch (error) {
        console.error("Department Report Error:", error);

        res.status(500).json({
            message: "Failed to generate department report"
        });
    }
}


async function sendMail(req, res) {
    try {

        if (!req.body.email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: "Welcome",
            text: "Welcome to Employee Management System"
        });

        res.status(200).json({
            message: "Email Sent Successfully"
        });

    } catch (error) {
        console.error("Send Mail Error:", error);

        res.status(500).json({
            message: "Failed to send email"
        });
    }
}

async function bulkImportEmployees(req, res) {

    try {

        const { employees } = req.body;

        if (!Array.isArray(employees) || employees.length === 0) {

            return res.status(400).json({ message: "No employee rows provided" });

        }

        const departments = await Department.find({ status: "Active" });

        const designations = await Designation.find({ status: "Active" });

        const findDept = (name) => departments.find(d => d.name.toLowerCase() === String(name || "").trim().toLowerCase());

        const findDesig = (name) => designations.find(d => d.name.toLowerCase() === String(name || "").trim().toLowerCase());

        const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });

        let nextNumber = 1;

        if (lastEmployee?.employeeId) {

            const lastNumber = parseInt(lastEmployee.employeeId.replace("EMP", ""));

            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;

        }

        const results = { created: 0, failed: [] };

        for (let i = 0; i < employees.length; i++) {

            const row = employees[i];

            const rowNum = i + 2; // header + 1-index

            try {

                if (!row.name || !row.salary || !row.joiningDate) {

                    results.failed.push({ row: rowNum, message: "Missing name, salary, or joiningDate" });

                    continue;

                }

                const dept = findDept(row.department);

                if (!dept) { results.failed.push({ row: rowNum, message: `Department "${row.department}" not found or inactive` }); continue; }

                const desig = findDesig(row.designation);

                if (!desig) { results.failed.push({ row: rowNum, message: `Designation "${row.designation}" not found or inactive` }); continue; }

                await Employee.create({

                    employeeId: `EMP${String(nextNumber).padStart(3, "0")}`,

                    name: row.name.trim(),

                    salary: Number(row.salary),

                    department: dept._id,

                    designation: desig._id,

                    joiningDate: row.joiningDate,

                    status: row.status === "Inactive" ? "Inactive" : "Active",

                    ...(row.email && { email: row.email.toLowerCase().trim() }),

                    ...(row.phone && { phone: row.phone.trim() }),

                    ...(row.workLocation && { workLocation: row.workLocation.trim() }),

                    ...(row.employmentType && { employmentType: row.employmentType })

                });

                nextNumber += 1;

                results.created += 1;

            } catch (error) {

                results.failed.push({ row: rowNum, message: error.message || "Failed to create employee" });

            }

        }

        res.status(200).json({ message: `Imported ${results.created} of ${employees.length} employees`, ...results });

    } catch (error) {

        console.error("Bulk Import Employees Error:", error);

        res.status(500).json({ message: "Failed to import employees" });

    }

}



module.exports = {
    getEmployees,
    addEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    uploadImage,
    departmentReport,
    sendMail,
    getMyProfile,
    updateMyProfile,
    bulkImportEmployees
};
