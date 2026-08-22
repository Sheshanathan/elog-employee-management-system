import { useEffect, useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLogo from "../components/AppLogo";
import { PasswordField } from "../components/FormField";
import { getDashboardPath } from "../utils/auth";
import { getUserDisplayName } from "../utils/userDisplay";
import { useAuth } from "../context/AuthContext";
import "../styles/design-system.css";

const EMAIL_PATTERN =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errors, setErrors] = useState({
        email: "",
        password: "",
        form: ""
    });

    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    /*
     * Show message when user was redirected to login
     * because their account/employee became inactive.
     */
    useEffect(() => {
        const loginMessage =
            sessionStorage.getItem("loginMessage");

        if (loginMessage) {
            setErrors((previous) => ({
                ...previous,
                form: loginMessage
            }));

            sessionStorage.removeItem("loginMessage");
        }
    }, []);

    function getFieldError(field, value) {
        if (field === "email") {
            if (!value.trim()) {
                return "Email is required";
            }

            if (!EMAIL_PATTERN.test(value.trim())) {
                return "Enter a valid email address";
            }
        }

        if (field === "password") {
            if (!value) {
                return "Password is required";
            }
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
        const emailError =
            getFieldError("email", email);

        const passwordError =
            getFieldError("password", password);

        const nextErrors = {
            email: emailError,
            password: passwordError,
            form: ""
        };

        setErrors(nextErrors);

        return !emailError && !passwordError;
    }

    async function handleLogin(e) {
        e.preventDefault();

        /*
         * Remove any previous server message
         * when the user tries to log in again.
         */
        setErrors((previous) => ({
            ...previous,
            form: ""
        }));

        /*
         * Validate fields first.
         */
        const isValid = validateAllFields();

        if (!isValid) {
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post("/login", {
                email: email.trim(),
                password
            });

            login({
                token: response.data.token,
                role: response.data.role,
                name:
                    response.data.name ||
                    getUserDisplayName(response.data) ||
                    response.data.email ||
                    ""
            });

            toast.success("Login Successful");

            navigate(
                getDashboardPath(response.data.role)
            );

        } catch (error) {
            const status = error.response?.status;
            const message =
                error.response?.data?.message;

            /*
             * Invalid email/password.
             */
            if (status === 401) {
                setErrors({
                    email: "",
                    password: "",
                    form:
                        message ||
                        "Invalid email or password"
                });

                return;
            }

            /*
             * Disabled user account OR inactive employee.
             */
            if (status === 403) {
                setErrors({
                    email: "",
                    password: "",
                    form:
                        message ||
                        "Your account has been disabled"
                });

                return;
            }

            /*
             * Backend validation errors.
             */
            if (
                status === 400 &&
                error.response?.data?.errors
            ) {
                const backendErrors =
                    error.response.data.errors;

                setErrors({
                    email:
                        backendErrors.email || "",
                    password:
                        backendErrors.password || "",
                    form: ""
                });

                return;
            }

            /*
             * Other unexpected errors.
             */
            toast.error(
                message || "Login failed"
            );

        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">

                {/* LOGO */}
                <div className="login-brand">
                    <Link to="/">
                        <AppLogo
                            className="app-logo app-logo-login"
                            alt="elog Employee Management System"
                        />
                    </Link>
                </div>

                <h1>Sign In</h1>

                <p className="login-subtitle">
                    Access your elog workspace
                </p>

                <form
                    onSubmit={handleLogin}
                    noValidate
                >

                    {/* SERVER / ACCOUNT MESSAGE */}
                    {errors.form && (
                        <div
                            className="login-form-error"
                            role="alert"
                        >
                            {errors.form}
                        </div>
                    )}

                    {/* EMAIL */}
                    <div className="form-field">

                        <label htmlFor="login-email">
                            Email{" "}
                            <span className="required-mark">
                                *
                            </span>
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            autoComplete="email"
                            className={
                                errors.email
                                    ? "input-error"
                                    : ""
                            }
                            onChange={(e) => {
                                const value =
                                    e.target.value;

                                setEmail(value);

                                validateField(
                                    "email",
                                    value
                                );
                            }}
                            onBlur={(e) => {
                                validateField(
                                    "email",
                                    e.target.value
                                );
                            }}
                        />

                        {errors.email && (
                            <span className="field-error">
                                {errors.email}
                            </span>
                        )}

                    </div>

                    {/* PASSWORD */}
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
                            const value =
                                e.target.value;

                            setPassword(value);

                            validateField(
                                "password",
                                value
                            );
                        }}
                        onBlur={(e) => {
                            validateField(
                                "password",
                                e.target.value
                            );
                        }}
                    />

                    {/* FORGOT PASSWORD */}
                    <div className="login-forgot-link">
                        <Link to="/forgot-password">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* LOGIN BUTTON */}
                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Signing In..."
                            : "Login"}
                    </button>

                </form>
            </div>
        </div>
    );
}

export default Login;