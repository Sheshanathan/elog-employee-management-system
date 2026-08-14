import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import { PasswordField } from "../components/FormField";
import "../styles/design-system.css";

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenError, setTokenError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});

    function validateField(field, value) {
        let error = "";

        if (field === "password") {
            if (!value) {
                error = "Password is required";
            } else if (value.length < 8) {
                error = "Password must contain at least 8 characters";
            } else if (!/[A-Z]/.test(value)) {
                error = "Password must contain at least one uppercase letter";
            } else if (!/[a-z]/.test(value)) {
                error = "Password must contain at least one lowercase letter";
            } else if (!/[0-9]/.test(value)) {
                error = "Password must contain at least one number";
            }
        }

        if (field === "confirmPassword") {
            if (!value) {
                error = "Confirm password is required";
            } else if (value !== password) {
                error = "Passwords do not match";
            }
        }

        setErrors((previous) => ({
            ...previous,
            [field]: error
        }));

        return error;
    }

    function validateAllFields() {
        const passwordError = validateField("password", password);
        const confirmPasswordError = validateField(
            "confirmPassword",
            confirmPassword
        );

        return !(passwordError || confirmPasswordError);
    }

    useEffect(() => {
        async function validateToken() {
            try {
                await api.get(
                    `${import.meta.env.VITE_API_URL}/validate-reset-token/${token}`
                );

                setTokenValid(true);
            } catch (error) {
                setTokenError(
                    error.response?.data?.message ||
                    "Invalid reset link. Please request a new password reset link."
                );
            } finally {
                setValidating(false);
            }
        }

        validateToken();
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            const response = await api.post(
                `${import.meta.env.VITE_API_URL}/reset-password/${token}`,
                {
                    password
                }
            );

            toast.success(response.data.message);

            navigate("/login");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Something went wrong"
            );
        }
    }

    if (validating) {
        return null;
    }

    if (!tokenValid) {
        return (
            <div className="auth-container">
                <div className="login-box invalid-reset-box">
                    <h1>Invalid Reset Link</h1>

                    <p className="reset-error-message">
                        {tokenError}
                    </p>

                    <button
                        type="button"
                        className="reset-link-button"
                        onClick={() => navigate("/forgot-password")}
                    >
                        Request New Reset Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="login-box">
                <h1>Reset Password</h1>

                <form onSubmit={handleSubmit} noValidate>
                    <PasswordField
                        name="password"
                        label="New Password"
                        required
                        value={password}
                        placeholder="New Password"
                        autoComplete="new-password"
                        wrapperClassName="form-field"
                        inputErrorClassName="input-error"
                        errorClassName="field-error"
                        error={errors.password}
                        onChange={(e) => {
                            const value = e.target.value;
                            setPassword(value);
                            validateField("password", value);

                            if (confirmPassword) {
                                validateField("confirmPassword", confirmPassword);
                            }
                        }}
                    />

                    <PasswordField
                        name="confirmPassword"
                        label="Confirm Password"
                        required
                        value={confirmPassword}
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                        wrapperClassName="form-field"
                        inputErrorClassName="input-error"
                        errorClassName="field-error"
                        error={errors.confirmPassword}
                        onChange={(e) => {
                            const value = e.target.value;
                            setConfirmPassword(value);
                            validateField("confirmPassword", value);
                        }}
                    />

                    <button type="submit" className="login-submit-btn">
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
