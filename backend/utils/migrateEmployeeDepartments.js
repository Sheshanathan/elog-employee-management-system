const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const Department = require("../models/Department");

async function migrateEmployeeDepartments() {
    try {
        const employees = await Employee.find({}).lean();
        let migrated = 0;

        for (const employee of employees) {
            const { department } = employee;

            if (!department) {
                continue;
            }

            if (mongoose.Types.ObjectId.isValid(department) && String(department).length === 24) {
                const exists = await Department.findById(department);
                if (exists) {
                    continue;
                }
            }

            const departmentName =
                typeof department === "string"
                    ? department.trim()
                    : department?.name?.trim();

            if (!departmentName) {
                continue;
            }

            let dept = await Department.findOne({
                name: {
                    $regex: `^${departmentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                    $options: "i"
                }
            });

            if (!dept) {
                dept = await Department.create({
                    name: departmentName,
                    status: "Active"
                });
            }

            await Employee.updateOne(
                { _id: employee._id },
                { $set: { department: dept._id } }
            );

            migrated += 1;
        }

        if (migrated > 0) {
            console.log(`Migrated ${migrated} employee department reference(s) to ObjectId`);
        }
    } catch (error) {
        console.error("Employee department migration error:", error.message);
    }
}

module.exports = migrateEmployeeDepartments;
