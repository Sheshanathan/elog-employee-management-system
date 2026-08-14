const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Department name is required"],
            unique: true,
            trim: true,
            minlength: [2, "Department name must contain at least 2 characters"],
            maxlength: [50, "Department name cannot exceed 50 characters"],
            validate: {
                validator: function (value) {
                    return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value);
                },
                message: "Department name should contain only letters and spaces"
            }
        },

        description: {
            type: String,
            trim: true,
            maxlength: [200, "Description cannot exceed 200 characters"]
        },

        status: {
            type: String,
            required: [true, "Status is required"],
            enum: {
                values: ["Active", "Inactive"],
                message: "Status must be Active or Inactive"
            },
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Department", departmentSchema);