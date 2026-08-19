const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        // Employee ID
        employeeId: {
            type: String,
            required: [true, "Employee ID is required"],
            unique: true,
            trim: true
        },

        // Personal Information
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must contain at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
            validate: {
                validator: function (value) {
                    return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value);
                },
                message: "Name should contain only letters and spaces"
            }
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Enter a valid email address"
            ]
        },

        phone: {
            type: String,
            trim: true,
            match: [
                /^[0-9+()\-\s]{7,20}$/,
                "Enter a valid phone number"
            ]
        },

        // Employment Information
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: [true, "Department is required"]
        },

        designation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Designation",
            required: [true, "Designation is required"]
        },

        joiningDate: {
            type: Date,
            required: [true, "Joining date is required"],
            validate: {
                validator: function (value) {
                    return value <= new Date();
                },
                message: "Joining date cannot be in the future"
            }
        },

        employmentType: {
            type: String,
            enum: {
                values: [
                    "Full-time",
                    "Part-time",
                    "Contract",
                    "Intern"
                ],
                message:
                    "Employment Type must be Full-time, Part-time, Contract, or Intern"
            },
            default: "Full-time"
        },

        workLocation: {
            type: String,
            trim: true,
            maxlength: [
                100,
                "Work location cannot exceed 100 characters"
            ]
        },

        // Compensation
        salary: {
            type: Number,
            required: [true, "Salary is required"],
            min: [1, "Salary must be greater than 0"]
        },

        // Employment Status
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

module.exports = mongoose.model("Employee", employeeSchema);