const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const mongoose = require("mongoose");
const transporter = require("../config/mail");

async function getEmployees(req, res) {
    try {
        const filter = {};

        if (req.query.name) {
            filter.name = {
                $regex: req.query.name,
                $options: "i"
            };
        }

        const employees = await Employee.find(filter)
            .populate("department", "name")
            .populate("designation", "name");

        res.status(200).json(employees);

    } catch (error) {
        console.error("Get Employees Error:", error);

        res.status(500).json({
            message: "Failed to retrieve employees"
        });
    }
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

        const lastEmployee =
            await Employee.findOne()
                .sort({
                    employeeId: -1
                });

        let employeeNumber = 1;

        if (
            lastEmployee &&
            lastEmployee.employeeId
        ) {
            const lastNumber =
                parseInt(
                    lastEmployee.employeeId
                        .replace("EMP", "")
                );

            if (!isNaN(lastNumber)) {
                employeeNumber =
                    lastNumber + 1;
            }
        }

        const employeeId =
            `EMP${String(employeeNumber).padStart(3, "0")}`;

        const employee =
            await Employee.create({
                employeeId,
                name,
                salary,
                department,
                designation,
                joiningDate,
                status
            });

        res.status(201).json({
            message:
                "Employee Created Successfully",
            employee
        });

    } catch (error) {
        console.error(
            "Add Employee Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Employee ID already exists"
            });
        }

        if (
            error.name ===
            "ValidationError"
        ) {
            const errors = {};

            Object.keys(
                error.errors
            ).forEach((field) => {
                errors[field] =
                    error.errors[field]
                        .message;
            });

            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message:
                "Failed to create employee"
        });
    }
}


async function getEmployeeById(
    req,
    res
) {
    try {

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid Employee ID"
            });
        }

        const employee =
    await Employee.findById(req.params.id)
        .populate("department", "name")
        .populate("designation", "name");

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee Not Found"
            });
        }

        res.status(200).json(employee);

    } catch (error) {
        console.error(
            "Get Employee Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve employee"
        });
    }
}


async function updateEmployee(
    req,
    res
) {
    try {

        const {
            name,
            salary,
            department,
            designation,
            joiningDate,
            status
        } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid Employee ID"
            });
        }

        const employee =
    await Employee.findByIdAndUpdate(
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
    )
    .populate("department", "name")
    .populate("designation", "name");

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee Not Found"
            });
        }

        res.status(200).json({
            message:
                "Employee Updated Successfully",
            employee
        });

    } catch (error) {

        console.error(
            "Update Employee Error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const errors = {};

            Object.keys(
                error.errors
            ).forEach((field) => {
                errors[field] =
                    error.errors[field]
                        .message;
            });

            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        res.status(500).json({
            message:
                "Failed to update employee"
        });
    }
}


async function deleteEmployee(
    req,
    res
) {
    try {

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid Employee ID"
            });
        }

        const employee =
            await Employee.findByIdAndDelete(
                req.params.id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee Not Found"
            });
        }

        res.status(200).json({
            message:
                "Employee Deleted Successfully"
        });

    } catch (error) {

        console.error(
            "Delete Employee Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to delete employee"
        });
    }
}


async function uploadImage(
    req,
    res
) {
    try {

        if (!req.file) {
            return res.status(400).json({
                message:
                    "No image file uploaded"
            });
        }

        res.status(200).json({
            message:
                "File Uploaded Successfully",
            file: req.file
        });

    } catch (error) {

        console.error(
            "Upload Image Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to upload image"
        });
    }
}


async function departmentReport(req, res) {
    try {
        const report = await Employee.aggregate([
            {
                $group: {
                    _id: "$department",

                    totalEmployees: {
                        $sum: 1
                    },

                    averageSalary: {
                        $avg: "$salary"
                    },

                    totalPayroll: {
                        $sum: "$salary"
                    }
                }
            },

            {
                $lookup: {
                    from: "departments",
                    localField: "_id",
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
                $project: {
                    _id: 0,

                    department: {
                        $ifNull: [
                            "$departmentInfo.name",
                            "N/A"
                        ]
                    },

                    totalEmployees: 1,

                    averageSalary: {
                        $round: [
                            "$averageSalary",
                            0
                        ]
                    },

                    totalPayroll: 1
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
        console.error(
            "Department Report Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to generate department report"
        });
    }
}


async function importEmployees(req, res) {
    try {
        const { employees } = req.body;

        if (!Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({
                message: "No employees provided for import"
            });
        }

        let created = 0;
        let skipped = 0;

        const failed = [];
        const importedIds = new Set();

        for (let index = 0; index < employees.length; index++) {
            const row = employees[index];

            // +1 because row 1 is the CSV header
            const rowNumber = index + 2;

            try {
                let {
                    employeeId,
                    name,
                    department,
                    designation,
                    joiningDate,
                    salary,
                    status
                } = row;

                // Clean values
                employeeId = employeeId
                    ?.toString()
                    .trim()
                    .toUpperCase();

                name = name?.toString().trim();
                department = department?.toString().trim();
                designation = designation?.toString().trim();
                joiningDate = joiningDate?.toString().trim();
                status = status?.toString().trim();

                /*
                 * Required fields
                 */
                if (
                    !name ||
                    !department ||
                    !designation ||
                    salary === undefined ||
                    salary === null ||
                    salary === "" ||
                    !joiningDate ||
                    !status
                ) {
                    failed.push({
                        row: rowNumber,
                        message:
                            "Missing required employee data"
                    });

                    continue;
                }

                /*
                 * Salary
                 */
                const numericSalary = Number(salary);

                if (
                    Number.isNaN(numericSalary) ||
                    numericSalary <= 0
                ) {
                    failed.push({
                        row: rowNumber,
                        message:
                            "Salary must be a valid number greater than 0"
                    });

                    continue;
                }

                /*
                 * Status
                 */
                status =
                    status.charAt(0).toUpperCase() +
                    status.slice(1).toLowerCase();

                if (!["Active", "Inactive"].includes(status)) {
                    failed.push({
                        row: rowNumber,
                        message:
                            "Status must be Active or Inactive"
                    });

                    continue;
                }

                /*
                 * JOINING DATE
                 *
                 * Accept:
                 * YYYY-MM-DD
                 * DD/MM/YY
                 * DD/MM/YYYY
                 * MM/DD/YY
                 * MM/DD/YYYY
                 */
                let parsedDate;

                if (/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) {
                    const [year, month, day] =
                        joiningDate.split("-").map(Number);

                    parsedDate = new Date(
                        year,
                        month - 1,
                        day
                    );

                    if (
                        parsedDate.getFullYear() !== year ||
                        parsedDate.getMonth() !== month - 1 ||
                        parsedDate.getDate() !== day
                    ) {
                        parsedDate = null;
                    }
                } else if (
                    /^\d{2}\/\d{2}\/\d{2}$/.test(joiningDate) ||
                    /^\d{2}\/\d{2}\/\d{4}$/.test(joiningDate)
                ) {
                    const parts = joiningDate
                        .split("/")
                        .map(Number);

                    let day = parts[0];
                    let month = parts[1];
                    let year = parts[2];

                    if (year < 100) {
                        year += 2000;
                    }

                    parsedDate = new Date(
                        year,
                        month - 1,
                        day
                    );

                    if (
                        parsedDate.getFullYear() !== year ||
                        parsedDate.getMonth() !== month - 1 ||
                        parsedDate.getDate() !== day
                    ) {
                        parsedDate = null;
                    }
                } else {
                    parsedDate = null;
                }

                if (!parsedDate) {
                    failed.push({
                        row: rowNumber,
                        message:
                            "Joining Date must be a valid date (YYYY-MM-DD or DD/MM/YYYY)"
                    });

                    continue;
                }

                /*
                 * Future date check
                 */
                const today = new Date();

                today.setHours(
                    23,
                    59,
                    59,
                    999
                );

                if (parsedDate > today) {
                    failed.push({
                        row: rowNumber,
                        message:
                            "Joining Date cannot be in the future"
                    });

                    continue;
                }

                /*
                 * EMPLOYEE ID
                 *
                 * If CSV contains ID:
                 * check duplicates.
                 */
                if (employeeId) {
                    if (importedIds.has(employeeId)) {
                        skipped++;
                        continue;
                    }

                    importedIds.add(employeeId);

                    const existingEmployee =
                        await Employee.findOne({
                            employeeId
                        });

                    if (existingEmployee) {
                        skipped++;
                        continue;
                    }
                } else {
                    /*
                     * Generate Employee ID
                     */
                    const lastEmployee =
                        await Employee.findOne()
                            .sort({
                                employeeId: -1
                            });

                    let employeeNumber = 1;

                    if (
                        lastEmployee &&
                        lastEmployee.employeeId
                    ) {
                        const lastNumber =
                            parseInt(
                                lastEmployee.employeeId
                                    .replace("EMP", "")
                            );

                        if (!Number.isNaN(lastNumber)) {
                            employeeNumber =
                                lastNumber + 1;
                        }
                    }

                    employeeId =
                        `EMP${String(employeeNumber).padStart(3, "0")}`;

                    while (
                        await Employee.findOne({
                            employeeId
                        })
                    ) {
                        employeeNumber++;

                        employeeId =
                            `EMP${String(employeeNumber).padStart(3, "0")}`;
                    }
                }

/*
 * Convert Designation name to ObjectId
 */
const designationDoc = await Designation.findOne({
    name: {
        $regex: `^${designation}$`,
        $options: "i"
    }
});

if (!designationDoc) {
    failed.push({
        row: rowNumber,
        message: `Designation "${designation}" not found`
    });

    continue;
}

/*
 * Create employee
 */
await Employee.create({
    employeeId,
    name,
    department: departmentDoc._id,
    designation: designationDoc._id,
    joiningDate: parsedDate,
    salary: numericSalary,
    status
});

created++;
            } catch (error) {
                console.error(
                    `Import row ${rowNumber} error:`,
                    error
                );

                /*
                 * Duplicate key
                 */
                if (error.code === 11000) {
                    skipped++;
                    continue;
                }

                /*
                 * Mongoose validation
                 */
                if (error.name === "ValidationError") {
                    const messages =
                        Object.values(error.errors)
                            .map(
                                item => item.message
                            )
                            .join(", ");

                    failed.push({
                        row: rowNumber,
                        message:
                            messages ||
                            "Employee validation failed"
                    });

                    continue;
                }

                failed.push({
                    row: rowNumber,
                    message:
                        error.message ||
                        "Failed to import employee"
                });
            }
        }

        return res.status(200).json({
            message: "Employee import completed",
            created,
            skipped,
            failed
        });

    } catch (error) {
        console.error(
            "Import Employees Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to import employees"
        });
    }
}

async function sendMail(
    req,
    res
) {
    try {

        if (!req.body.email) {
            return res.status(400).json({
                message:
                    "Email is required"
            });
        }

        await transporter.sendMail({
            from:
                process.env.EMAIL_USER,

            to:
                req.body.email,

            subject:
                "Welcome",

            text:
                "Welcome to Employee Management System"
        });

        res.status(200).json({
            message:
                "Email Sent Successfully"
        });

    } catch (error) {

        console.error(
            "Send Mail Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to send email"
        });
    }
}
async function getMyProfile(req, res){
    try {
        const employee = await Employee.findOne({
            user: req.user.id
        }).select("-__v");

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found"
            });
        }

        res.json(employee);
    } catch (error) {
        console.error("Get My Profile Error:", error);

        res.status(500).json({
            message: "Failed to retrieve profile"
        });
    }
};

async function updateMyProfile(req, res){
    try {
        const employee = await Employee.findOne({
            user: req.user.id
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found"
            });
        }

        const allowedFields = [
            "name",
            "email",
            "phone",
            "address"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                employee[field] = req.body[field];
            }
        });

        await employee.save();

        res.json({
            message: "Profile updated successfully",
            employee
        });
    } catch (error) {
        console.error("Update My Profile Error:", error);

        res.status(500).json({
            message: "Failed to update profile"
        });
    }
};
module.exports = {
    getEmployees,
    addEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    uploadImage,
    departmentReport,
    sendMail,
    importEmployees,
    updateMyProfile,
    getMyProfile
};