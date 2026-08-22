function validateName(value) {
    return (
        typeof value === "string" &&
        /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim()) &&
        value.trim().length >= 2
    );
}

function validateEmail(value) {
    return (
        typeof value === "string" &&
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
            value.trim()
        )
    );
}

function validatePassword(value) {
    return (
        typeof value === "string" &&
        value.length >= 8 &&
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /[0-9]/.test(value)
    );
}

function validateObjectId(value) {
    return (
        typeof value === "string" &&
        /^[a-fA-F0-9]{24}$/.test(value.trim())
    );
}

function validateEmployeeData(req, res, next) {
    const {
        name,
        department,
        designation,
        joiningDate,
        salary,
        status,
        newDepartmentName,
        newDesignationName
    } = req.body;

    const errors = {};

    if (!name) {
        errors.name = "Name is required";
    } else if (!validateName(name)) {
        errors.name =
            "Name should contain only letters and spaces and must contain at least 2 characters";
    }

    const hasNewDepartment =
        typeof newDepartmentName === "string" && newDepartmentName.trim();

    if (!hasNewDepartment) {
        if (!department) {
            errors.department = "Department is required";
        } else if (!validateObjectId(department)) {
            errors.department = "A valid department must be selected";
        }
    }

    const hasNewDesignation =
        typeof newDesignationName === "string" && newDesignationName.trim();

    if (!hasNewDesignation) {
        if (!designation) {
            errors.designation = "Designation is required";
        } else if (!validateObjectId(designation)) {
            errors.designation = "A valid designation must be selected";
        }
    }

    if (joiningDate) {
        const date = new Date(joiningDate);
        if (isNaN(date.getTime())) {
            errors.joiningDate = "Invalid joining date";
        } else if (date > new Date()) {
            errors.joiningDate = "Joining date cannot be in the future";
        }
    }

    if (salary === undefined || salary === null || salary === "") {
        errors.salary = "Salary is required";
    } else if (typeof salary !== "number" || !Number.isFinite(salary)) {
        errors.salary = "Salary must be a valid number";
    } else if (salary <= 0) {
        errors.salary = "Salary must be greater than zero";
    }

    if (!status) {
        errors.status = "Status is required";
    } else if (!["Active", "Inactive"].includes(status)) {
        errors.status = "Status must be Active or Inactive";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors
        });
    }

    next();
}

function validateUserData(req, res, next) {
    const {
        name,
        email,
        password,
        role,
        employee
    } = req.body;

    const errors = {};

    if (!email) {
        errors.email = "Email is required";
    } else if (!validateEmail(email)) {
        errors.email = "Enter a valid email address";
    }

    if (req.method === "POST") {
        if (!password) {
            errors.password = "Password is required";
        } else if (!validatePassword(password)) {
            errors.password =
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number";
        }
    } else if (password !== undefined && password !== "") {
        if (!validatePassword(password)) {
            errors.password =
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number";
        }
    }

    if (!role) {
        errors.role = "Role is required";
    } else if (!["Admin", "Employee"].includes(role)) {
        errors.role = "Role must be Admin or Employee";
    }

    if (role === "Admin") {
        if (!name || !String(name).trim()) {
            errors.name = "Name is required for an Admin account";
        } else if (!validateName(name)) {
            errors.name =
                "Name should contain only letters and spaces and must contain at least 2 characters";
        } else if (String(name).trim().length > 50) {
            errors.name = "Name cannot exceed 50 characters";
        }
    }

    if (role === "Employee") {
        if (!employee) {
            errors.employee = "Employee selection is required";
        } else if (!validateObjectId(String(employee))) {
            errors.employee = "A valid employee must be selected";
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors
        });
    }

    next();
}
function validateLogin(req, res, next) {
    const { email, password } = req.body;

    const errors = {};

    if (!email) {
        errors.email = "Email is required";
    } else if (!validateEmail(email)) {
        errors.email = "Enter a valid email address";
    }

    if (!password) {
        errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors
        });
    }

    next();
}


function validateForgotPassword(req, res, next) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            message: "Enter a valid email address"
        });
    }

    next();
}


function validateResetPassword(req, res, next) {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({
            message:
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number"
        });
    }

    next();
}

function validateLeaveData(req, res, next) {
    const {
        leaveType,
        fromDate,
        toDate,
        reason
    } = req.body;

    const errors = {};

    const validLeaveTypes = [
        "Casual Leave",
        "Sick Leave",
        "Earned Leave",
        "Unpaid Leave",
        "Optional Holiday"
    ];

    if (!leaveType) {
        errors.leaveType = "Leave type is required";
    } else if (!validLeaveTypes.includes(leaveType)) {
        errors.leaveType = "Invalid leave type";
    }

    if (!fromDate) {
        errors.fromDate = "From date is required";
    }

    if (!toDate) {
        errors.toDate = "To date is required";
    }

    if (fromDate) {
        const parsedFromDate = new Date(fromDate);

        if (isNaN(parsedFromDate.getTime())) {
            errors.fromDate = "From date must be a valid date";
        }
    }

    if (toDate) {
        const parsedToDate = new Date(toDate);

        if (isNaN(parsedToDate.getTime())) {
            errors.toDate = "To date must be a valid date";
        }
    }

    if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (
            !isNaN(start.getTime()) &&
            !isNaN(end.getTime()) &&
            end < start
        ) {
            errors.toDate =
                "To date cannot be before from date";
        }
    }

    if (!reason || !reason.trim()) {
        errors.reason = "Reason is required";
    } else if (reason.trim().length < 3) {
        errors.reason =
            "Reason must contain at least 3 characters";
    } else if (reason.trim().length > 500) {
        errors.reason =
            "Reason cannot exceed 500 characters";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors
        });
    }

    next();
}


module.exports = {
    validateEmployeeData,
    validateUserData,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateLeaveData
};
