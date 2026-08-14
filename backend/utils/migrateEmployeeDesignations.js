const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const Designation = require("../models/Designation");

async function migrateEmployeeDesignations() {
    try {
        const employees = await Employee.find({}).lean();
        let migrated = 0;

        for (const employee of employees) {
            const { designation } = employee;

            if (!designation) {
                continue;
            }

            if (mongoose.Types.ObjectId.isValid(designation) && String(designation).length === 24) {
                const exists = await Designation.findById(designation);
                if (exists) {
                    continue;
                }
            }

            const designationName =
                typeof designation === "string"
                    ? designation.trim()
                    : designation?.name?.trim();

            if (!designationName) {
                continue;
            }

            let role = await Designation.findOne({
                name: {
                    $regex: `^${designationName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                    $options: "i"
                }
            });

            if (!role) {
                role = await Designation.create({
                    name: designationName,
                    status: "Active"
                });
            }

            await Employee.updateOne(
                { _id: employee._id },
                { $set: { designation: role._id } }
            );

            migrated += 1;
        }

        if (migrated > 0) {
            console.log(`Migrated ${migrated} employee designation reference(s) to ObjectId`);
        }
    } catch (error) {
        console.error("Employee designation migration error:", error.message);
    }
}

module.exports = migrateEmployeeDesignations;
