import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api";
import { toast } from "react-toastify";
import { FormField, LoadingSpinner } from "../components/FormField";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import { getDashboardPath } from "../utils/auth";
import "../styles/design-system.css";

const EMAIL_PATTERN =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const PHONE_PATTERN =
    /^[0-9+()\-\s]{7,20}$/;

const NAME_PATTERN =
    /^[A-Za-z]+(?: [A-Za-z]+)*$/;

function Profile() {
    const navigate = useNavigate();

    const role = localStorage.getItem("role");

    const [user, setUser] = useState(null);
    const [employee, setEmployee] = useState(null);

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: ""
    });

    const [errors, setErrors] = useState({});

    /*
     * =====================================================
     * LOAD PROFILE
     * =====================================================
     */
    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                /*
                 * User profile endpoint works for both
                 * Admin and Employee.
                 */
                const response =
                    await api.get(
                        "/users/my/profile"
                    );

                if (!mounted) {
                    return;
                }

                const profile =
                    response.data;

                setUser(profile);

                /*
                 * Employee information is populated
                 * when the logged-in user has an employee.
                 */
                if (
                    profile.role === "Employee" &&
                    profile.employee
                ) {
                    setEmployee(
                        profile.employee
                    );
                }

                setForm({
                    name:
                        profile.name || "",
                    email:
                        profile.email || "",
                    phone:
                        profile.phone || ""
                });

            } catch (error) {
                if (!mounted) {
                    return;
                }

                toast.error(
                    error.response?.data
                        ?.message ||
                    "Failed to load profile"
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    /*
     * =====================================================
     * VALIDATION
     * =====================================================
     */
    const validateField = (
        field,
        value
    ) => {
        let error = "";

        if (field === "name") {
            const name =
                String(
                    value || ""
                ).trim();

            if (!name) {
                error =
                    "Name is required";
            } else if (
                name.length < 2
            ) {
                error =
                    "Name must contain at least 2 characters";
            } else if (
                name.length > 50
            ) {
                error =
                    "Name cannot exceed 50 characters";
            } else if (
                !NAME_PATTERN.test(
                    name
                )
            ) {
                error =
                    "Name should contain only letters and spaces";
            }
        }

        if (field === "email") {
            const email =
                String(
                    value || ""
                ).trim();

            if (!email) {
                error =
                    "Email is required";
            } else if (
                !EMAIL_PATTERN.test(
                    email
                )
            ) {
                error =
                    "Enter a valid email address";
            }
        }

        if (field === "phone") {
            const phone =
                String(
                    value || ""
                ).trim();

            /*
             * Phone is optional.
             */
            if (
                phone &&
                !PHONE_PATTERN.test(
                    phone
                )
            ) {
                error =
                    "Enter a valid phone number";
            }
        }

        setErrors(
            (previous) => ({
                ...previous,
                [field]: error
            })
        );

        return error;
    };

    /*
     * =====================================================
     * HANDLE CHANGE
     * =====================================================
     */
    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setForm(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );

        if (errors[name]) {
            setErrors(
                (previous) => ({
                    ...previous,
                    [name]: ""
                })
            );
        }
    };

    /*
     * =====================================================
     * CANCEL EDIT
     * =====================================================
     */
    const handleCancel = () => {
        setEditing(false);

        setForm({
            name:
                user?.name || "",
            email:
                user?.email || "",
            phone:
                user?.phone || ""
        });

        setErrors({});
    };

    /*
     * =====================================================
     * SAVE PROFILE
     * =====================================================
     */
    const handleSave = async () => {
        const nameError =
            validateField(
                "name",
                form.name
            );

        const emailError =
            validateField(
                "email",
                form.email
            );

        const phoneError =
            validateField(
                "phone",
                form.phone
            );

        if (
            nameError ||
            emailError ||
            phoneError
        ) {
            toast.error(
                "Please fix the errors in the form"
            );

            return;
        }

        try {
            setSaving(true);

            const response =
                await api.patch(
                    "/users/my/profile",
                    {
                        name:
                            form.name.trim(),

                        email:
                            form.email
                                .trim()
                                .toLowerCase(),

                        phone:
                            form.phone.trim()
                    }
                );

            const updatedUser =
                response.data.user;

            setUser(updatedUser);

            /*
             * Keep localStorage account name
             * synchronized with the updated profile.
             */
            localStorage.setItem(
                "name",
                updatedUser.name
            );

            /*
             * Update local employee reference
             * if present.
             */
            if (
                updatedUser.role ===
                    "Employee" &&
                updatedUser.employee
            ) {
                setEmployee(
                    updatedUser.employee
                );
            }

            setForm({
                name:
                    updatedUser.name ||
                    "",
                email:
                    updatedUser.email ||
                    "",
                phone:
                    updatedUser.phone ||
                    ""
            });

            setEditing(false);

            setErrors({});

            toast.success(
                "Profile updated successfully"
            );

        } catch (error) {
            const backendErrors =
                error.response?.data
                    ?.errors;

            if (backendErrors) {
                setErrors(
                    backendErrors
                );
            }

            toast.error(
                error.response?.data
                    ?.message ||
                "Failed to update profile"
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * =====================================================
     * LOADING
     * =====================================================
     */
    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>My Profile</h1>

                    <p>
                        Account and role details
                    </p>
                </div>

                <div className="page-actions">
                    {!editing && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                setEditing(
                                    true
                                )
                            }
                        >
                            Edit Profile
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate(
                                getDashboardPath()
                            )
                        }
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="employee-profile-grid">

                {/* =================================================
                    ACCOUNT INFORMATION
                ================================================= */}
                <div className="employee-profile-card">
                    <h2>
                        Account Information
                    </h2>

                    {editing ? (
                        <>
                            <FormField
                                label="Full Name"
                                name="name"
                                type="text"
                                value={
                                    form.name
                                }
                                onChange={
                                    handleChange
                                }
                                onBlur={(e) =>
                                    validateField(
                                        "name",
                                        e.target
                                            .value
                                    )
                                }
                                error={
                                    errors.name
                                }
                                required
                                placeholder="Enter full name"
                            />

                            <FormField
                                label="Email"
                                name="email"
                                type="email"
                                value={
                                    form.email
                                }
                                onChange={
                                    handleChange
                                }
                                onBlur={(e) =>
                                    validateField(
                                        "email",
                                        e.target
                                            .value
                                    )
                                }
                                error={
                                    errors.email
                                }
                                required
                                placeholder="employee@company.com"
                            />

                            <FormField
                                label="Phone"
                                name="phone"
                                type="tel"
                                value={
                                    form.phone
                                }
                                onChange={
                                    handleChange
                                }
                                onBlur={(e) =>
                                    validateField(
                                        "phone",
                                        e.target
                                            .value
                                    )
                                }
                                error={
                                    errors.phone
                                }
                                placeholder="+91 9876543210"
                            />

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={
                                        handleCancel
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className={`btn btn-primary ${
                                        saving
                                            ? "is-loading"
                                            : ""
                                    }`}
                                    onClick={
                                        handleSave
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="profile-field">
                                <span>
                                    Name
                                </span>

                                <strong>
                                    {user?.name ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="profile-field">
                                <span>
                                    Email
                                </span>

                                <strong>
                                    {user?.email ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="profile-field">
                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {user?.phone ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="profile-field">
                                <span>
                                    Role
                                </span>

                                <strong>
                                    {user?.role ||
                                        role ||
                                        "—"}
                                </strong>
                            </div>
                        </>
                    )}
                </div>


                {/* =================================================
                    EMPLOYMENT INFORMATION
                    Only Employee sees this.
                ================================================= */}
                {user?.role ===
                    "Employee" &&
                    employee && (
                        <div className="employee-profile-card">
                            <h2>
                                Employment Information
                            </h2>

                            <div className="profile-field">
                                <span>
                                    Employee ID
                                </span>

                                <strong>
                                    {
                                        employee.employeeId
                                    }
                                </strong>
                            </div>

                            <div className="profile-field">
                                <span>
                                    Department
                                </span>

                                <strong>
                                    {getDepartmentName(
                                        employee.department
                                    )}
                                </strong>
                            </div>

                            <div className="profile-field">
                                <span>
                                    Designation
                                </span>

                                <strong>
                                    {getDesignationName(
                                        employee.designation
                                    )}
                                </strong>
                            </div>

                            <div className="profile-field">
                                <span>
                                    Joining Date
                                </span>

                                <strong>
                                    {employee.joiningDate
                                        ? new Date(
                                            employee.joiningDate
                                        ).toLocaleDateString(
                                            "en-GB"
                                        )
                                        : "N/A"}
                                </strong>
                            </div>
                        </div>
                    )}
            </div>
        </Layout>
    );
}

export default Profile;