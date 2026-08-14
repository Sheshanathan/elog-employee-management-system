import { useEffect, useState} from "react";
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
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);

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

        return !(nameError || emailError || roleError);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            await api.put(
                `${import.meta.env.VITE_API_URL}/users/${id}`,
                {
                    name,
                    email,
                    role
                }
            );

            toast.success("User Updated Successfully");

            navigate("/users");

        } catch (error) {
            console.log(error);

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
                        onChange={(e) => {
                            const value = e.target.value;
                            setRole(value);
                            validateField("role", value);
                        }}
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

                <button type="submit">
                    Update User
                </button>
            </form>
        </Layout>
    );
}

export default EditUser;