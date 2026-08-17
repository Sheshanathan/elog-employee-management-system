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

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function Profile() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(role === "Employee");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "" });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (role !== "Employee") return;
        (async () => {
            try {
                const response = await api.get("/employees/my/profile");
                setEmployee(response.data);
                setForm({
                    name: response.data.name || "",
                    email: response.data.email || "",
                    phone: response.data.phone || "",
                });
            } catch {
                // Fall back to basic account info only.
            } finally {
                setLoading(false);
            }
        })();
    }, [role]);

    function validateField(field, value) {
        let error = "";
        if (field === "name") {
            if (!value.trim()) error = "Name is required";
            else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) error = "Name should contain only letters and spaces";
        }
        if (field === "email" && value && !EMAIL_PATTERN.test(value.trim())) {
            error = "Enter a valid email address";
        }
        if (field === "phone" && value && !/^[0-9+()\-\s]{7,20}$/.test(value.trim())) {
            error = "Enter a valid phone number";
        }
        setErrors((prev) => ({ ...prev, [field]: error }));
        return error;
    }

    function handleChange(e) {
        const { name: field, value } = e.target;
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        const nameError = validateField("name", form.name);
        const emailError = validateField("email", form.email);
        const phoneError = validateField("phone", form.phone);
        if (nameError || emailError || phoneError) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setSaving(true);
        try {
            const response = await api.patch("/employees/my/profile", {
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
            });
            setEmployee(response.data.employee);
            localStorage.setItem("name", response.data.employee.name);
            toast.success("Profile updated successfully");
            setEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>My Profile</h1>
                    <p>Account and role details</p>
                </div>
                <div className="page-actions">
                    {role === "Employee" && !editing && (
                        <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                    )}
                    <button className="btn btn-secondary" onClick={() => navigate(getDashboardPath())}>
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="employee-profile-grid">
                <div className="employee-profile-card">
                    <h2>Account Information</h2>

                    {role === "Employee" && editing ? (
                        <>
                            <FormField label="Full Name" name="name" value={form.name} onChange={handleChange}
                                onBlur={(e) => validateField("name", e.target.value)} error={errors.name} required />
                            <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange}
                                onBlur={(e) => validateField("email", e.target.value)} error={errors.email} />
                            <FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                                onBlur={(e) => validateField("phone", e.target.value)} error={errors.phone} />
                            <div className="form-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setEditing(false);
                                        setForm({ name: employee?.name || "", email: employee?.email || "", phone: employee?.phone || "" });
                                        setErrors({});
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button className={`btn btn-primary ${saving ? "is-loading" : ""}`} onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="profile-field"><span>Name</span><strong>{name || employee?.name || "—"}</strong></div>
                            <div className="profile-field"><span>Email</span><strong>{employee?.email || "—"}</strong></div>
                            <div className="profile-field"><span>Phone</span><strong>{employee?.phone || "—"}</strong></div>
                            <div className="profile-field"><span>Role</span><strong>{role || "—"}</strong></div>
                        </>
                    )}
                </div>

                {role === "Employee" && employee && (
                    <div className="employee-profile-card">
                        <h2>Employment Information</h2>
                        <div className="profile-field"><span>Employee ID</span><strong>{employee.employeeId}</strong></div>
                        <div className="profile-field"><span>Department</span><strong>{getDepartmentName(employee.department)}</strong></div>
                        <div className="profile-field"><span>Designation</span><strong>{getDesignationName(employee.designation)}</strong></div>
                        <div className="profile-field">
                            <span>Joining Date</span>
                            <strong>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-GB") : "N/A"}</strong>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Profile;