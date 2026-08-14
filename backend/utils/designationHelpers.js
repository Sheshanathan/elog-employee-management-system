const mongoose = require("mongoose");
const Designation = require("../models/Designation");

async function validateDesignationAssignment(designationId, { allowInactive = false } = {}) {
    if (!designationId) {
        return { valid: false, status: 400, message: "Designation is required" };
    }

    if (!mongoose.Types.ObjectId.isValid(designationId)) {
        return { valid: false, status: 400, message: "Invalid designation ID" };
    }

    const designation = await Designation.findById(designationId);

    if (!designation) {
        return { valid: false, status: 404, message: "Designation not found" };
    }

    if (!allowInactive && designation.status !== "Active") {
        return {
            valid: false,
            status: 400,
            message: "Cannot assign an inactive designation to an employee"
        };
    }

    return { valid: true, designation };
}

module.exports = {
    validateDesignationAssignment
};
