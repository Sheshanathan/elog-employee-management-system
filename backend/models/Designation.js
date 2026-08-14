const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Designation name is required"],
            trim: true,
            minlength: [2, "Designation name must contain at least 2 characters"],
            maxlength: [50, "Designation name cannot exceed 50 characters"],
            validate: {
                validator: function (value) {
                    return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value);
                },
                message: "Designation name should contain only letters and spaces"
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

designationSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Designation", designationSchema);