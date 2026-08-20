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

    if (!name) {
        errors.name = "Name is required";
    } else if (!validateName(name)) {
        errors.name =
            "Name should contain only letters and spaces and must contain at least 2 characters";
    }

    if (!email) {
        errors.email = "Email is required";
    } else if (!validateEmail(email)) {
        errors.email = "Enter a valid email address";
    }

    if (password !== undefined) {
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

    if (role === "Employee" && !employee) {
        errors.employee = "Employee selection is required";
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


module.exports = {
    validateEmployeeData,
    validateUserData,
    validateLogin,
    validateForgotPassword,
    validateResetPassword
};