const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (value) {
                    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
                        value
                    );
                },
                message: "Enter a valid email address"
            }
        },

        phone: {
            type: String,
            trim: true,
            match: [
                /^[0-9+()\-\s]{7,20}$/,
                "Enter a valid phone number"
            ]
        },

        password: {
            type: String,
            required: [true, "Password is required"]
        },

        // Administrators are not employee records, so their name belongs to
        // their account. Employee account names are always resolved from the
        // linked Employee document instead.
        name: {
            type: String,
            trim: true,
            minlength: [2, "Name must contain at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
            validate: {
                validator: function (value) {
                    return !value || /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value);
                },
                message: "Name should contain only letters and spaces"
            }
        },

        role: {
            type: String,
            enum: ["Admin", "Employee"],
            required: [true, "Role is required"]
        },

        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        passwordResetToken: {
            type: String,
            default: null
        },

        passwordResetExpires: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

function attachDisplayName(_doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;

    const employeeName =
        ret.employee &&
        typeof ret.employee === "object" &&
        ret.employee.name
            ? ret.employee.name
            : null;

    // `name` remains the account name for admins. `displayName` gives every
    // API consumer one safe rendering field without duplicating employee data.
    ret.displayName =
        ret.role === "Employee"
            ? employeeName
            : ret.name || null;

    return ret;
}

userSchema.set("toJSON", {
    transform: attachDisplayName
});

userSchema.set("toObject", {
    transform: attachDisplayName
});

// One employee can have only one login account.
userSchema.index(
    { employee: 1 },
    {
        unique: true,
        sparse: true
    }
);

module.exports = mongoose.model("User", userSchema);
