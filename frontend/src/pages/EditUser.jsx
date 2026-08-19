import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
 
function EditUser() {
    const { id } = useParams();
    const navigate = useNavigate();
 
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [employee, setEmployee] = useState("");
    const [employees, setEmployees] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [employeesLoading, setEmployeesLoading] = useState(false);
 
    useEffect(() => {
        let isMounted = true;
 
        async function fetchUser() {
            try {
                setLoading(true);
 
                const response = await api.get(
                    `${import.meta.env.VITE_API_URL}/users/${id}`
                );
 
                if (!isMounted) {
                    return;
                }
 
                const user = response.data;
 
                setName(user.name || "");
                setEmail(user.email || "");
                setRole(user.role || "");
                setEmployee(
                    typeof user.employee === "string"
                        ? user.employee
                        : user.employee?._id || ""
                );
 
            } catch (error) {
                if (!isMounted) {
                    return;
                }
 
                console.log(error);
 
                if (error.response?.status === 400) {
                    toast.error("Invalid User ID");
                } else if (error.response?.status === 404) {
                    toast.error("User Not Found");
                } else {
                    toast.error("Failed to load user");
                }
 
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
 
    // Load employee list whenever the role is (or becomes) Employee,
    // so the current link can be shown and changed.
    useEffect(() => {
        let isMounted = true;
 
        async function fetchEmployees() {
            if (role !== "Employee") {
                return;
            }
 
            setEmployeesLoading(true);
 
            try {
                const response = await api.get("/employees");
 
                if (!isMounted) {
                    return;
                }
 
                setEmployees(
                    Array.isArray(response.data)
                        ? response.data
                        : response.data.employees || []
                );
            } catch (error) {
                if (!isMounted) {
                    return;
                }
 
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
 
    function validateField(field, value) {
        let error = "";
 
        if (field === "name") {
            if (!value.trim()) {
                error = "Name is required";
            } else if (value.trim().length < 2) {
                error = "Name must contain at least 2 characters";
            } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) {
                error = "Name should contain only letters and spaces";
            }
        }
 
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
 
        if (field === "role") {
            if (!value) {
                error = "Role is required";
            }
        }
 
        if (field === "employee") {
            if (role === "Employee" && !value) {
                error = "Employee selection is required";
            }
        }
 
        setErrors((previous) => ({
            ...previous,
            [field]: error
        }));
 
        return error;
    }
 
    function validateAllFields() {
        const nameError = validateField("name", name);
        const emailError = validateField("email", email);
        const roleError = validateField("role", role);
        const employeeError =
            role === "Employee" ? validateField("employee", employee) : "";
 
        return !(nameError || emailError || roleError || employeeError);
    }
 
    function handleRoleChange(value) {
        setRole(value);
        validateField("role", value);
 
        if (value !== "Employee") {
            setEmployee("");
            setErrors((previous) => ({
                ...previous,
                employee: ""
            }));
        }
    }
 
    async function handleSubmit(e) {
        e.preventDefault();
 
        if (!validateAllFields()) {
            toast.error("Please fix the errors in the form");
            return;
        }
 
        try {
            await api.put(
                `${import.meta.env.VITE_API_URL}/users/${id}`,
                {
                    name,
                    email,
                    role,
                    ...(role === "Employee" && { employee })
                }
            );
 
            toast.success("User Updated Successfully");
 
            navigate("/users");
 
        } catch (error) {
            console.log(error);
 
            const apiErrors = error.response?.data?.errors;
 
            if (apiErrors) {
                setErrors((previous) => ({
                    ...previous,
                    ...apiErrors
                }));
            }
 
            const message =
                error.response?.data?.message ||
                "Something went wrong";
 
            toast.error(message);
        }
    }
 
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
            <h1>Edit User</h1>
 
            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label>Name</label>
 
                    <input
                        type="text"
                        value={name}
                        className={errors.name ? "input-error" : ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            setName(value);
                            validateField("name", value);
                        }}
                    />
 
                    {errors.name && (
                        <span className="field-error">
                            {errors.name}
                        </span>
                    )}
                </div>
 
                <div className="form-field">
                    <label>Email</label>
 
                    <input
                        type="email"
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
 
                <div className="form-field">
                    <label>Role</label>
 
                    <select
                        value={role}
                        className={errors.role ? "input-error" : ""}
                        onChange={(e) => handleRoleChange(e.target.value)}
                    >
                        <option value="">Select Role</option>
                        <option value="Employee">Employee</option>
                        <option value="Admin">Admin</option>
                    </select>
 
                    {errors.role && (
                        <span className="field-error">
                            {errors.role}
                        </span>
                    )}
                </div>
 
                {role === "Employee" && (
                    <div className="form-field">
                        <label>Link to Employee</label>
 
                        <select
                            value={employee}
                            disabled={employeesLoading}
                            className={errors.employee ? "input-error" : ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEmployee(value);
                                validateField("employee", value);
                            }}
                        >
                            <option value="">
                                {employeesLoading
                                    ? "Loading employees..."
                                    : "Select Employee"}
                            </option>
 
                            {employees.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.employeeId} - {item.name}
                                </option>
                            ))}
                        </select>
 
                        {errors.employee && (
                            <span className="field-error">
                                {errors.employee}
                            </span>
                        )}
 
                        {!employeesLoading && employees.length === 0 && (
                            <span className="field-error">
                                No employees found. Create an employee record first.
                            </span>
                        )}
                    </div>
                )}
 
                <button type="submit">
                    Update User
                </button>
            </form>
        </Layout>
    );
}
 
export default EditUser;