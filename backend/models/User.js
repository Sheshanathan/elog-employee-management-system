const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [
                2,
                "Name must contain at least 2 characters"
            ],
            validate: {
                validator: function (value) {
                    return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                        value.trim()
                    );
                },
                message:
                    "Name should contain only letters and spaces"
            }
        },

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

        /*
         * Phone Number
         */
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

// Prevent one employee from having multiple user accounts.
userSchema.index(
    { employee: 1 },
    {
        unique: true,
        sparse: true
    }
);

module.exports = mongoose.model("User", userSchema);