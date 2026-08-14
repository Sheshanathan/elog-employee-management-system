import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import { formatCurrency } from "../utils/currency";

function ViewEmployee() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEmployee() {
            try {

                const response = await api.get(
                    `${import.meta.env.VITE_API_URL}/employees/${id}`
                );

                setEmployee(response.data);

            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }

        fetchEmployee();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <h2>Loading Employee...</h2>
            </Layout>
        );
    }

    if (!employee) {
        return (
            <Layout>
                <h2>Employee Not Found</h2>

                <button onClick={() => navigate("/employees")}>
                    Back to Employees
                </button>
            </Layout>
        );
    }

    return (
        <Layout>
            <h1>Employee Details</h1>

            <div className="employee-details">

                <p>
                    <strong>Employee ID:</strong>{" "}
                    {employee.employeeId}
                </p>

                <p>
                    <strong>Name:</strong>{" "}
                    {employee.name}
                </p>

                <p>
                    <strong>Department:</strong>{" "}
                    {getDepartmentName(employee.department)}
                </p>

                <p>
                    <strong>Designation:</strong>{" "}
                    {getDesignationName(employee.designation)}
                </p>

                <p>
                    <strong>Salary:</strong>{" "}
                    {formatCurrency(employee.salary)}
                </p>

                <p>
                    <strong>Joining Date:</strong>{" "}
                    {employee.joiningDate
                        ? new Date(employee.joiningDate)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, "-")
                        : "N/A"}
                </p>

                <p>
                    <strong>Status:</strong>{" "}
                    {employee.status || "Active"}
                </p>

                <button onClick={() => navigate("/employees")}>
                    Back to Employees
                </button>

            </div>
        </Layout>
    );
}

export default ViewEmployee;