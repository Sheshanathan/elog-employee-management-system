import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import { FormField, PasswordField } from "../components/FormField";
import { toast } from "react-toastify";
import '../styles/design-system.css';

function CreateUser() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "Employee",
        employee: ""
    });

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (formData.role === "Employee") {
            loadEmployees();
        } else {
            setEmployees([]);
            setFormData(prev => ({ ...prev, employee: "" }));
        }
    }, [formData.role]);

    const loadEmployees = async () => {
        try {
            const response = await api.get("/employees");
            setEmployees(Array.isArray(response.data) ? response.data : response.data.employees || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load employees");
        }
    };

    const validateField = (field, value) => {
        let error = "";

        if (field === "name") {
            if (!value.trim()) {
                error = "Name is required";
            } else if (value.trim().length < 2) {
                error = "Name must be at least 2 characters";
            } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) {
                error = "Name should contain only letters and spaces";
            }
        }

        if (field === "email") {
            if (!value.trim()) {
                error = "Email is required";
            } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value.trim())) {
                error = "Enter a valid email address";
            }
        }

        if (field === "password") {
            if (!value) {
                error = "Password is required";
            } else if (value.length < 8) {
                error = "Password must be at least 8 characters";
            } else if (!/[A-Z]/.test(value)) {
                error = "Password must contain at least one uppercase letter";
            } else if (!/[a-z]/.test(value)) {
                error = "Password must contain at least one lowercase letter";
            } else if (!/[0-9]/.test(value)) {
                error = "Password must contain at least one number";
            }
        }

        if (field === "role") {
            if (!value) {
                error = "Role is required";
            }
        }

        if (field === "employee") {
            if (formData.role === "Employee" && !value) {
                error = "Employee selection is required";
            }
        }

        setErrors(prev => ({
            ...prev,
            [field]: error
        }));

        return error === "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const validateAllFields = () => {
        let isValid = true;

        if (!validateField("name", formData.name)) isValid = false;
        if (!validateField("email", formData.email)) isValid = false;
        if (!validateField("password", formData.password)) isValid = false;
        if (!validateField("role", formData.role)) isValid = false;
        if (formData.role === "Employee") {
            if (!validateField("employee", formData.employee)) isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAllFields()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            setLoading(true);

            const userData = {
                name: formData.name.trim(),
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                role: formData.role,
                ...(formData.role === "Employee" && { employee: formData.employee })
            };

            await api.post("/users", userData);

            toast.success("User created successfully");

            setFormData({
                name: "",
                email: "",
                password: "",
                role: "Employee",
                employee: ""
            });

            setTimeout(() => {
                navigate("/users");
            }, 800);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>Create User Account</h1>
                    <p>Create a new login account for employees</p>
                </div>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    {/* Account Information Section */}
                    <h3 style={{ marginTop: 0 }}>Account Information</h3>

                    <FormField
                        label="Full Name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.name}
                        required
                        placeholder="Enter full name"
                        helperText="First and last name required"
                    />

                    <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        required
                        placeholder="user@company.com"
                        helperText="Will be used for login"
                    />

                    <PasswordField
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.password}
                        required
                        placeholder="Enter secure password"
                        helperText="Must be 8+ characters with uppercase, lowercase, and numbers"
                    />

                    {/* Role & Assignment Section */}
                    <h3>Role & Assignment</h3>

                    <FormField
                        label="User Role"
                        name="role"
                        type="select"
                        value={formData.role}
                        onChange={handleChange}
                        error={errors.role}
                        required
                        options={[
                            { value: "Employee", label: "Employee" },
                            { value: "Admin", label: "Administrator" }
                        ]}
                    />

                    {formData.role === "Employee" && (
                        <FormField
                            label="Link to Employee"
                            name="employee"
                            type="select"
                            value={formData.employee}
                            onChange={handleChange}
                            error={errors.employee}
                            required
                            options={employees.map(emp => ({
                                value: emp._id,
                                label: `${emp.employeeId} - ${emp.name}`
                            }))}
                            helperText="Select the employee record to link with this account"
                        />
                    )}

                    {formData.role === "Employee" && employees.length === 0 && (
                        <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <strong>No employees found.</strong> Create an employee record first.
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate("/users")}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'is-loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default CreateUser;