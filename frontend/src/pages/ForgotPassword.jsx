import { useState } from "react";
import api from "../api";
import { toast } from "react-toastify";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    function validateField(field, value) {
        let error = "";

        if (field === "email") {
            if (!value.trim()) {
                error = "Email is required";
            } else if (
                !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
                    value.trim()
                )
            ) {
                error = "Enter a valid email address";
            }
        }

        setErrors((previous) => ({
            ...previous,
            [field]: error
        }));

        return error;
    }

    function validateAllFields() {
        const emailError = validateField("email", email);

        return !emailError;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                `${import.meta.env.VITE_API_URL}/forgot-password`,
                { email }
            );

            toast.success(response.data.message);

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Something went wrong"
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">

            <div className="login-box">

                <h1>Forgot Password</h1>

                <form onSubmit={handleSubmit}>

                    <div className="form-field">

                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="Enter Email"
                            value={email}
                            className={errors.email ? "input-error" : ""}
                            onChange={(e) => {
                                const value = e.target.value;

                                setEmail(value);

                                validateField("email", value);
                            }}
                        />

                        {errors.email && (
                            <span className="field-error">
                                {errors.email}
                            </span>
                        )}

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending..."
                            : "Send Reset Link"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default ForgotPassword;