import { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLogo from "../components/AppLogo";
import { PasswordField } from "../components/FormField";
import { getDashboardPath } from "../utils/auth";
import '../styles/design-system.css';

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    function getFieldError(field, value) {
        if (field === "email") {
            if (!value.trim()) {
                return "Email is required";
            }

            if (!EMAIL_PATTERN.test(value.trim())) {
                return "Enter a valid email address";
            }
        }

        if (field === "password" && !value) {
            return "Password is required";
        }

        return "";
    }

    function validateField(field, value) {
        const error = getFieldError(field, value);

        setErrors((previous) => ({
            ...previous,
            [field]: error,
            form: ""
        }));

        return error;
    }

    function validateAllFields() {
        const nextErrors = {
            email: getFieldError("email", email),
            password: getFieldError("password", password),
            form: ""
        };

        setErrors(nextErrors);

        return !nextErrors.email && !nextErrors.password;
    }

    async function handleLogin(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post(
                `${import.meta.env.VITE_API_URL}/login`,
                {
                    email: email.trim(),
                    password
                }
            );

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.role);
            localStorage.setItem("name", response.data.name);

            toast.success("Login Successful");

            navigate(getDashboardPath(response.data.role));
        } catch (error) {
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 400 && data?.errors) {
                setErrors({
                    email: data.errors.email || "",
                    password: data.errors.password || "",
                    form: ""
                });
                return;
            }

            if (status === 401 || status === 403) {
                setErrors({
                    email: "",
                    password: "",
                    form: data?.message || "Invalid email or password"
                });
                return;
            }

            toast.error(data?.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-brand">
                    <Link to="/">
                        <AppLogo className="app-logo app-logo-login" alt="elog Employee Management System" />
                    </Link>
                </div>

                <h1>Sign In</h1>
                <p className="login-subtitle">Access your elog workspace</p>

                <form onSubmit={handleLogin} noValidate>
                    {errors.form && (
                        <div className="login-form-error" role="alert">
                            {errors.form}
                        </div>
                    )}

                    <div className="form-field">
                        <label htmlFor="login-email">
                            Email <span className="required-mark">*</span>
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            autoComplete="email"
                            className={errors.email ? "input-error" : ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEmail(value);
                                validateField("email", value);
                            }}
                            onBlur={(e) => validateField("email", e.target.value)}
                        />

                        {errors.email && (
                            <span className="field-error">
                                {errors.email}
                            </span>
                        )}
                    </div>

                    <PasswordField
                        name="login-password"
                        label="Password"
                        required
                        value={password}
                        placeholder="Password"
                        autoComplete="current-password"
                        wrapperClassName="form-field"
                        inputErrorClassName="input-error"
                        errorClassName="field-error"
                        error={errors.password}
                        onChange={(e) => {
                            const value = e.target.value;
                            setPassword(value);
                            validateField("password", value);
                        }}
                        onBlur={(e) => validateField("password", e.target.value)}
                    />

                    <div className="login-forgot-link">
                        <Link to="/forgot-password">
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? "Signing In..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
