const mongoose = require("mongoose");
const Department = require("../models/Department");

async function validateDepartmentAssignment(departmentId, { allowInactive = false } = {}) {
    if (!departmentId) {
        return { valid: false, status: 400, message: "Department is required" };
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return { valid: false, status: 400, message: "Invalid department ID" };
    }

    const department = await Department.findById(departmentId);

    if (!department) {
        return { valid: false, status: 404, message: "Department not found" };
    }

    if (!allowInactive && department.status !== "Active") {
        return {
            valid: false,
            status: 400,
            message: "Cannot assign an inactive department to an employee"
        };
    }

    return { valid: true, department };
}

module.exports = {
    validateDepartmentAssignment
};
