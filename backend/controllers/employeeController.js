const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const mongoose = require("mongoose");
const transporter = require("../config/mail");
const User = require("../models/User");

function escapeRegex(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

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
            email,
            phone,
            workLocation,
            salary,
            department,
            designation,
            joiningDate,
            employmentType,
            status,
            newDepartmentName,
            newDesignationName
        } = req.body;

        /*
         * =========================================================
         * BASIC INPUT NORMALISATION
         * =========================================================
         */

        const employeeName =
            typeof name === "string" ? name.trim() : "";

        const employeeEmail =
            typeof email === "string"
                ? email.trim().toLowerCase()
                : "";

        const employeePhone =
            typeof phone === "string"
                ? phone.trim()
                : "";

        const employeeWorkLocation =
            typeof workLocation === "string"
                ? workLocation.trim()
                : "";

        const employeeJoiningDate =
            typeof joiningDate === "string"
                ? joiningDate.trim()
                : joiningDate;

        const employeeStatus =
            typeof status === "string"
                ? status.trim()
                : status;

        const employeeEmploymentType =
            typeof employmentType === "string" &&
            employmentType.trim()
                ? employmentType.trim()
                : "Full-time";

        /*
         * =========================================================
         * VALIDATE REQUIRED BASIC FIELDS
         * =========================================================
         */

        const validationErrors = {};

        if (!employeeName) {
            validationErrors.name = "Name is required";
        }

        if (
            salary === undefined ||
            salary === null ||
            salary === "" ||
            Number(salary) <= 0 ||
            Number.isNaN(Number(salary))
        ) {
            validationErrors.salary =
                "Salary must be greater than 0";
        }

        if (!employeeJoiningDate) {
            validationErrors.joiningDate =
                "Joining date is required";
        }

        if (!employeeStatus) {
            validationErrors.status =
                "Status is required";
        }

        if (
            employeeStatus &&
            !["Active", "Inactive"].includes(employeeStatus)
        ) {
            validationErrors.status =
                "Status must be Active or Inactive";
        }

        if (
            employeeEmploymentType &&
            ![
                "Full-time",
                "Part-time",
                "Contract",
                "Intern"
            ].includes(employeeEmploymentType)
        ) {
            validationErrors.employmentType =
                "Employment Type must be Full-time, Part-time, Contract, or Intern";
        }

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors
            });
        }

        /*
         * =========================================================
         * DEPARTMENT
         *
         * Existing:
         *     department = MongoDB ObjectId
         *
         * New:
         *     newDepartmentName = typed department name
         * =========================================================
         */

        let departmentId = null;

        const typedDepartmentName =
            typeof newDepartmentName === "string"
                ? newDepartmentName.trim()
                : "";

        const existingDepartmentId =
            typeof department === "string"
                ? department.trim()
                : "";

        if (typedDepartmentName) {
            /*
             * User selected "Add New Department".
             */

            const existingDepartment =
                await Department.findOne({
                    name: {
                        $regex: `^${escapeRegex(
                            typedDepartmentName
                        )}$`,
                        $options: "i"
                    }
                });

            if (existingDepartment) {
                return res.status(409).json({
                    message:
                        "Department already exists. Please select it from the list.",
                    errors: {
                        department:
                            "Department already exists"
                    }
                });
            }

            const newDepartment =
                await Department.create({
                    name: typedDepartmentName,
                    status: "Active"
                });

            departmentId = newDepartment._id;
        } else if (existingDepartmentId) {
            /*
             * User selected an existing department.
             */

            if (
                !mongoose.Types.ObjectId.isValid(
                    existingDepartmentId
                )
            ) {
                return res.status(400).json({
                    message: "Invalid department",
                    errors: {
                        department:
                            "Invalid department selected"
                    }
                });
            }

            const existingDepartment =
                await Department.findById(
                    existingDepartmentId
                );

            if (!existingDepartment) {
                return res.status(400).json({
                    message: "Department not found",
                    errors: {
                        department:
                            "Selected department does not exist"
                    }
                });
            }

            departmentId =
                existingDepartment._id;
        }

        if (!departmentId) {
            return res.status(400).json({
                message: "Validation failed",
                errors: {
                    department:
                        "Department is required"
                }
            });
        }

        /*
         * =========================================================
         * DESIGNATION
         *
         * Existing:
         *     designation = MongoDB ObjectId
         *
         * New:
         *     newDesignationName = typed designation name
         * =========================================================
         */

        let designationId = null;

        const typedDesignationName =
            typeof newDesignationName === "string"
                ? newDesignationName.trim()
                : "";

        const existingDesignationId =
            typeof designation === "string"
                ? designation.trim()
                : "";

        if (typedDesignationName) {
            /*
             * User selected "Add New Designation".
             */

            const existingDesignation =
                await Designation.findOne({
                    name: {
                        $regex: `^${escapeRegex(
                            typedDesignationName
                        )}$`,
                        $options: "i"
                    }
                });

            if (existingDesignation) {
                return res.status(409).json({
                    message:
                        "Designation already exists. Please select it from the list.",
                    errors: {
                        designation:
                            "Designation already exists"
                    }
                });
            }

            const newDesignation =
                await Designation.create({
                    name: typedDesignationName,
                    status: "Active"
                });

            designationId =
                newDesignation._id;
        } else if (existingDesignationId) {
            /*
             * User selected an existing designation.
             */

            if (
                !mongoose.Types.ObjectId.isValid(
                    existingDesignationId
                )
            ) {
                return res.status(400).json({
                    message: "Invalid designation",
                    errors: {
                        designation:
                            "Invalid designation selected"
                    }
                });
            }

            const existingDesignation =
                await Designation.findById(
                    existingDesignationId
                );

            if (!existingDesignation) {
                return res.status(400).json({
                    message: "Designation not found",
                    errors: {
                        designation:
                            "Selected designation does not exist"
                    }
                });
            }

            designationId =
                existingDesignation._id;
        }

        if (!designationId) {
            return res.status(400).json({
                message: "Validation failed",
                errors: {
                    designation:
                        "Designation is required"
                }
            });
        }

        /*
         * =========================================================
         * GENERATE EMPLOYEE ID
         * =========================================================
         */

        const lastEmployee =
            await Employee.findOne()
                .sort({ employeeId: -1 });

        let employeeNumber = 1;

        if (
            lastEmployee &&
            lastEmployee.employeeId
        ) {
            const lastNumber = parseInt(
                lastEmployee.employeeId.replace(
                    "EMP",
                    ""
                ),
                10
            );

            if (!Number.isNaN(lastNumber)) {
                employeeNumber =
                    lastNumber + 1;
            }
        }

        let employeeId =
            `EMP${String(employeeNumber).padStart(
                3,
                "0"
            )}`;

        while (
            await Employee.exists({
                employeeId
            })
        ) {
            employeeNumber++;

            employeeId =
                `EMP${String(employeeNumber).padStart(
                    3,
                    "0"
                )}`;
        }

        /*
         * =========================================================
         * CREATE EMPLOYEE
         * =========================================================
         */

        const employee =
            await Employee.create({
                employeeId,

                name: employeeName,

                email:
                    employeeEmail || undefined,

                phone:
                    employeePhone || undefined,

                workLocation:
                    employeeWorkLocation || undefined,

                salary: Number(salary),

                department: departmentId,

                designation: designationId,

                joiningDate:
                    employeeJoiningDate,

                employmentType:
                    employeeEmploymentType,

                status: employeeStatus
            });

        /*
         * =========================================================
         * POPULATE RESPONSE
         * =========================================================
         */

        await employee.populate([
            {
                path: "department",
                select: "name"
            },
            {
                path: "designation",
                select: "name"
            }
        ]);

        return res.status(201).json({
            message:
                "Employee Created Successfully",
            employee
        });

    } catch (error) {
        console.error(
            "Add Employee Error:",
            error
        );

        /*
         * Duplicate key
         */
        if (error.code === 11000) {
            const duplicateField =
                Object.keys(
                    error.keyPattern || {}
                )[0];

            if (
                duplicateField === "email"
            ) {
                return res.status(409).json({
                    message:
                        "Email already exists",
                    errors: {
                        email:
                            "Email already exists"
                    }
                });
            }

            if (
                duplicateField === "employeeId"
            ) {
                return res.status(409).json({
                    message:
                        "Employee ID already exists"
                });
            }

            return res.status(409).json({
                message:
                    "A duplicate employee record already exists"
            });
        }

        /*
         * Mongoose validation
         */
        if (
            error.name ===
            "ValidationError"
        ) {
            const errors = {};

            Object.keys(
                error.errors
            ).forEach((field) => {
                errors[field] =
                    error.errors[field].message;
            });

            return res.status(400).json({
                message:
                    "Validation failed",
                errors
            });
        }

        console.error(
            "Unexpected Add Employee Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create employee"
        });
    }
}

/*
 * Escape user input before using it in a MongoDB regex.
 */
function escapeRegex(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
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


async function updateEmployee(req, res) {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(req.params.id)
        ) {
            return res.status(400).json({
                message: "Invalid Employee ID"
            });
        }

        const employee = await Employee.findById(
            req.params.id
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee Not Found"
            });
        }

        const allowedFields = [
            "name",
            "email",
            "phone",
            "workLocation",
            "department",
            "designation",
            "joiningDate",
            "employmentType",
            "salary",
            "status"
        ];

        allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
    }
});

        await employee.save();

        await employee.populate([
            {
                path: "department",
                select: "name"
            },
            {
                path: "designation",
                select: "name"
            }
        ]);

        res.status(200).json({
            message: "Employee Updated Successfully",
            employee
        });

    } catch (error) {
        console.error(
            "Update Employee Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists"
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
            message: "Failed to update employee"
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
    email,
    phone,
    department,
    designation,
    joiningDate,
    employmentType,
    salary,
    status,
    workLocation
} = row;
                // Clean values
                employeeId = employeeId?.toString().trim().toUpperCase();
name = name?.toString().trim();
email = email?.toString().trim().toLowerCase();
phone = phone?.toString().trim();
department = department?.toString().trim();
designation = designation?.toString().trim();
joiningDate = joiningDate?.toString().trim();
employmentType = employmentType?.toString().trim();
salary = salary?.toString().trim();
status = status?.toString().trim();
workLocation = workLocation?.toString().trim();

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
 * Employment Type
 */
employmentType =
    employmentType || "Full-time";

if (
    ![
        "Full-time",
        "Part-time",
        "Contract",
        "Intern"
    ].includes(employmentType)
) {
    failed.push({
        row: rowNumber,
        message:
            "Employment Type must be Full-time, Part-time, Contract, or Intern"
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
 * Convert Department name to ObjectId
 */
const departmentDoc = await Department.findOne({
    name: {
        $regex: `^${department}$`,
        $options: "i"
    }
});

if (!departmentDoc) {
    failed.push({
        row: rowNumber,
        message: `Department "${department}" not found`
    });

    continue;
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
    email: email || undefined,
    phone: phone || undefined,
    department: departmentDoc._id,
    designation: designationDoc._id,
    joiningDate: parsedDate,
    employmentType,
    salary: numericSalary,
    status,
    workLocation: workLocation || undefined
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
async function getMyProfile(req, res) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        if (user.role !== "Employee") {
            return res.status(403).json({
                message: "Employee access required"
            });
        }

        if (!user.employee) {
            return res.status(400).json({
                message: "No employee profile is linked to this account"
            });
        }

        const employee = await Employee.findById(user.employee)
            .select("-__v")
            .populate("department", "name")
            .populate("designation", "name");

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found"
            });
        }

        res.status(200).json(employee);

    } catch (error) {
        console.error("Get My Profile Error:", error);

        res.status(500).json({
            message: "Failed to retrieve profile"
        });
    }
}
async function updateMyProfile(req, res){
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        if (user.role !== "Employee") {
            return res.status(403).json({
                message: "Employee access required"
            });
        }

        if (!user.employee) {
            return res.status(404).json({
                message: "Employee profile not found"
            });
        }

        const employee = await Employee.findById(user.employee);

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

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists"
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
