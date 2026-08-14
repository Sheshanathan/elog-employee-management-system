import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api";
import { LoadingSpinner } from "../components/FormField";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import { getDashboardPath } from "../utils/auth";
import "../styles/design-system.css";

function Profile() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(role === "Employee");

    useEffect(() => {
        if (role !== "Employee") return;

        async function loadProfile() {
            try {
                const response = await api.get("/employees/my/profile");
                setEmployee(response.data);
            } catch {
                // Fall back to basic account info only.
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [role]);

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
                    <p>Account and role details</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => navigate(getDashboardPath())}>
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="employee-profile-grid">
                <div className="employee-profile-card">
                    <h2>Account Information</h2>

                    <div className="profile-field">
                        <span>Name</span>
                        <strong>{name || employee?.name || "—"}</strong>
                    </div>

                    <div className="profile-field">
                        <span>Email</span>
                        <strong>{employee?.email || "—"}</strong>
                    </div>

                    <div className="profile-field">
                        <span>Role</span>
                        <strong>{role || "—"}</strong>
                    </div>

                    <div className="profile-field">
                        <span>Account Status</span>
                        <strong>Active</strong>
                    </div>
                </div>

                {role === "Employee" && employee && (
                    <div className="employee-profile-card">
                        <h2>Employment Information</h2>

                        <div className="profile-field">
                            <span>Employee ID</span>
                            <strong>{employee.employeeId}</strong>
                        </div>

                        <div className="profile-field">
                            <span>Department</span>
                            <strong>{getDepartmentName(employee.department)}</strong>
                        </div>

                        <div className="profile-field">
                            <span>Designation</span>
                            <strong>{getDesignationName(employee.designation)}</strong>
                        </div>

                        <div className="profile-field">
                            <span>Joining Date</span>
                            <strong>
                                {employee.joiningDate
                                    ? new Date(employee.joiningDate).toLocaleDateString("en-GB")
                                    : "N/A"}
                            </strong>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-muted" style={{ marginTop: "var(--spacing-8)" }}>
                Editing your name/email/phone is available for employee accounts via the
                existing profile update API. Password change requires a small backend
                addition (a new authenticated "change password" endpoint) — it isn't
                present in the current API, so it isn't wired up here yet.
            </p>
        </Layout>
    );
}

export default Profile;