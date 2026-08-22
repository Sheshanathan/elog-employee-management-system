import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { FormField } from "../components/FormField";
import { toast } from "react-toastify";
import "../styles/design-system.css";

function EditUser() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [employee, setEmployee] = useState("");
    const [employees, setEmployees] = useState([]);

    const [linkedEmployeeName, setLinkedEmployeeName] =
        useState("");

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [employeesLoading, setEmployeesLoading] =
        useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchUser() {
            try {
                setLoading(true);

                const response =
                    await api.get(`/users/${id}`);

                if (!isMounted) return;

                const user = response.data;

                setEmail(user.email || "");
                setName(user.name || "");
                setRole(user.role || "");

                const employeeId =
                    typeof user.employee === "string"
                        ? user.employee
                        : user.employee?._id || "";

                setEmployee(employeeId);

                setLinkedEmployeeName(
                    user.employee?.name || ""
                );

            } catch (error) {
                if (!isMounted) return;

                toast.error(
                    error.response?.data?.message ||
                    "Failed to load user"
                );

                navigate("/users");

            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchUser();

        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    useEffect(() => {
        let isMounted = true;

        async function fetchEmployees() {
            if (role !== "Employee") {
                return;
            }

            setEmployeesLoading(true);

            try {
                const response =
                    await api.get("/employees");

                if (!isMounted) return;

                setEmployees(
                    Array.isArray(response.data)
                        ? response.data
                        : response.data.employees || []
                );

            } catch (error) {
                if (!isMounted) return;

                toast.error(
                    error.response?.data?.message ||
                    "Failed to load employees"
                );

            } finally {
                if (isMounted) {
                    setEmployeesLoading(false);
                }
            }
        }

        fetchEmployees();

        return () => {
            isMounted = false;
        };
    }, [role]);

    const validateField = (field, value) => {
        let error = "";

        if (field === "email") {
            if (!value.trim()) {
                error = "Email is required";
            } else if (
                !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
                    value.trim()
                )
            ) {
                error =
                    "Enter a valid email address";
            }
        }

        if (field === "name" && role === "Admin") {
            if (!value.trim()) {
                error = "Name is required";
            } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) {
                error = "Name should contain only letters and spaces";
            }
        }

        if (field === "role") {
            if (!value) {
                error = "Role is required";
            }
        }

        if (field === "employee") {
            if (
                role === "Employee" &&
                !value
            ) {
                error =
                    "Employee selection is required";
            }
        }

        setErrors(previous => ({
            ...previous,
            [field]: error
        }));

        return !error;
    };

    const validateAllFields = () => {
        const emailValid =
            validateField("email", email);

        const roleValid =
            validateField("role", role);

        const nameValid =
            role === "Admin"
                ? validateField("name", name)
                : true;

        const employeeValid =
            role === "Employee"
                ? validateField(
                      "employee",
                      employee
                  )
                : true;

        return (
            emailValid &&
            roleValid &&
            nameValid &&
            employeeValid
        );
    };

    const handleRoleChange = (value) => {
        setRole(value);

        validateField("role", value);

        if (value !== "Employee") {
            setEmployee("");
            setLinkedEmployeeName("");

            setErrors(previous => ({
                ...previous,
                employee: ""
            }));
        }
    };

    const handleEmployeeChange = (value) => {
        setEmployee(value);

        const selectedEmployee =
            employees.find(
                item => item._id === value
            );

        setLinkedEmployeeName(
            selectedEmployee?.name || ""
        );

        validateField(
            "employee",
            value
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAllFields()) {
            toast.error(
                "Please fix the errors in the form"
            );
            return;
        }

        try {
            await api.put(
                `/users/${id}`,
                {
                    ...(role === "Admin" && {
                        name: name.trim()
                    }),
                    email: email
                        .trim()
                        .toLowerCase(),
                    role,
                    ...(role === "Employee" && {
                        employee
                    })
                }
            );

            toast.success(
                "User updated successfully"
            );

            navigate("/users");

        } catch (error) {
            const apiErrors =
                error.response?.data?.errors;

            if (apiErrors) {
                setErrors(previous => ({
                    ...previous,
                    ...apiErrors
                }));
            }

            toast.error(
                error.response?.data?.message ||
                "Failed to update user"
            );
        }
    };

    if (loading) {
        return (
            <Layout>
                <h1>Edit User</h1>
                <p>Loading user...</p>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>Edit User Account</h1>
                    <p>
                        Manage login and employee
                        assignment
                    </p>
                </div>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>

                    <h3 style={{ marginTop: 0 }}>
                        Account Information
                    </h3>

                    {role === "Admin" && (
                        <FormField
                            label="Full Name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                const value = e.target.value;
                                setName(value);
                                validateField("name", value);
                            }}
                            error={errors.name}
                            required
                            placeholder="Enter administrator name"
                        />
                    )}

                    <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            const value =
                                e.target.value;

                            setEmail(value);
                            validateField(
                                "email",
                                value
                            );
                        }}
                        error={errors.email}
                        required
                        placeholder="user@company.com"
                    />

                    <h3>
                        Role & Assignment
                    </h3>

                    <FormField
                        label="User Role"
                        name="role"
                        type="select"
                        value={role}
                        onChange={(e) =>
                            handleRoleChange(
                                e.target.value
                            )
                        }
                        error={errors.role}
                        required
                        options={[
                            {
                                value: "Employee",
                                label: "Employee"
                            },
                            {
                                value: "Admin",
                                label: "Administrator"
                            }
                        ]}
                    />

                    {role === "Employee" && (
                        <>
                            <FormField
                                label="Linked Employee"
                                name="employee"
                                type="select"
                                value={employee}
                                onChange={(e) =>
                                    handleEmployeeChange(
                                        e.target.value
                                    )
                                }
                                error={
                                    errors.employee
                                }
                                required
                                options={employees.map(
                                    item => ({
                                        value:
                                            item._id,
                                        label: `${item.employeeId} - ${item.name}`
                                    })
                                )}
                            />

                            {linkedEmployeeName && (
                                <div
                                    className="alert alert-info"
                                    style={{
                                        marginBottom:
                                            "var(--spacing-6)"
                                    }}
                                >
                                    Employee name is managed
                                    from the Employee record:
                                    <strong
                                        style={{
                                            marginLeft:
                                                "4px"
                                        }}
                                    >
                                        {
                                            linkedEmployeeName
                                        }
                                    </strong>
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                navigate("/users")
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Update User
                        </button>
                    </div>

                </form>
            </div>
        </Layout>
    );
}

export default EditUser;
