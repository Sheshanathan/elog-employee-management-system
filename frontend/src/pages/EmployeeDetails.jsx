import { useEffect, useState } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import { formatCurrency } from "../utils/currency";

function EmployeeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    const role = localStorage.getItem("role");

    useEffect(() => {
        async function fetchEmployee() {
            try {
                const response = await api.get(
                    `${import.meta.env.VITE_API_URL}/employees/${id}`
                );

                setEmployee(response.data);
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    "Failed to load employee";

                toast.error(message);

                setEmployee(null);
            } finally {
                setLoading(false);
            }
        }

        fetchEmployee();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="employee-profile-page">
                    <h2>Loading Employee...</h2>
                </div>
            </Layout>
        );
    }

    if (!employee) {
        return (
            <Layout>
                <div className="employee-profile-page">
                    <div className="employee-profile-error">
                        <h2>Employee Not Found</h2>

                        <p>
                            The employee you are looking for does not
                            exist or could not be loaded.
                        </p>

                        <button
                            onClick={() => navigate("/employees")}
                        >
                            Back to Employees
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="employee-profile-page">

                <div className="employee-profile-header">

                    <div>
                        <h1>{employee.name}</h1>

                        <p>
                            Employee ID: {employee.employeeId}
                        </p>
                    </div>

                    <div className="employee-profile-actions">

                        {role === "Admin" && (
                            <button
                                onClick={() =>
                                    navigate(
                                        `/edit-employee/${employee._id}`
                                    )
                                }
                            >
                                Edit Employee
                            </button>
                        )}

                        <button
                            className="secondary-button"
                            onClick={() =>
                                navigate("/employees")
                            }
                        >
                            Back to Employees
                        </button>

                    </div>

                </div>

                <div className="employee-profile-grid">

                    {/* Basic Information */}

                    <div className="employee-profile-card">

                        <h2>Basic Information</h2>

                        <div className="profile-field">
                            <span>Employee ID</span>
                            <strong>
                                {employee.employeeId}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Name</span>
                            <strong>
                                {employee.name}
                            </strong>
                        </div>

                    </div>


                    {/* Employment Information */}

                    <div className="employee-profile-card">

                        <h2>Employment Information</h2>

                        <div className="profile-field">
                            <span>Department</span>
                            <strong>
                                {getDepartmentName(employee.department)}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Designation</span>
                            <strong>
                                {getDesignationName(employee.designation)}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Joining Date</span>
                            <strong>
                                {employee.joiningDate
                                    ? new Date(
                                          employee.joiningDate
                                      ).toLocaleDateString("en-GB")
                                    : "N/A"}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Status</span>

                            <strong
                                className={
                                    employee.status === "Active"
                                        ? "profile-status active"
                                        : "profile-status inactive"
                                }
                            >
                                {employee.status}
                            </strong>
                        </div>

                    </div>


                    {/* Salary Information */}

                    <div className="employee-profile-card">

                        <h2>Compensation</h2>

                        <div className="profile-field">

                            <span>Salary</span>

                            <strong className="profile-salary">
                                {formatCurrency(employee.salary)}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>
        </Layout>
    );
}

export default EmployeeDetails;