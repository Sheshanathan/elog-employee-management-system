import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { Card, LoadingSpinner } from "../components/FormField";
import { getDepartmentName } from "../utils/department";
import { formatCurrency } from "../utils/currency";
import '../styles/design-system.css';

function Dashboard() {
    const [employees, setEmployees] = useState([]);
    const [departmentReport, setDepartmentReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [empRes, deptRes] = await Promise.all([
                api.get("/employees"),
                api.get("/employees/department-report")
            ]);

            setEmployees(empRes.data || []);
            setDepartmentReport(deptRes.data || []);
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    const totalDepartments = new Set(employees.map(e => getDepartmentName(e.department))).size;

    const highestSalary = employees.length > 0
        ? Math.max(...employees.map(e => e.salary))
        : 0;

    const averageSalary = employees.length > 0
        ? Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length)
        : 0;

    const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

    return (
        <Layout>
            <div className="dashboard-page">
                <div className="page-header">
                    <div className="page-title-section">
                        <h1>Admin Dashboard</h1>
                        <p>Organization overview and key metrics</p>
                    </div>
                </div>

                {/* Key Metrics — Employees */}
                <div className="grid-4">
                    <Card>
                        <div className="card-body">
                            <h4>Total Employees</h4>
                            <h2 style={{ color: 'var(--primary-600)' }}>{totalEmployees}</h2>
                            <small>Across organization</small>
                        </div>
                    </Card>

                    <Card>
                        <div className="card-body">
                            <h4>Active</h4>
                            <h2 style={{ color: 'var(--success-600)' }}>{activeEmployees}</h2>
                            <small>{totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% active</small>
                        </div>
                    </Card>

                    <Card>
                        <div className="card-body">
                            <h4>Inactive</h4>
                            <h2 style={{ color: 'var(--error-600)' }}>{inactiveEmployees}</h2>
                            <small>Deactivated</small>
                        </div>
                    </Card>

                    <Card>
                        <div className="card-body">
                            <h4>Departments</h4>
                            <h2 style={{ color: 'var(--secondary-600)' }}>{totalDepartments}</h2>
                            <small>Organizational units</small>
                        </div>
                    </Card>
                </div>

                {/* Key Metrics — Compensation */}
                <div className="grid-3" style={{ marginTop: 'var(--spacing-3)' }}>
                    <Card>
                        <div className="card-body">
                            <h4>Average Salary</h4>
                            <h2>{formatCurrency(averageSalary)}</h2>
                            <small>Per employee</small>
                        </div>
                    </Card>

                    <Card>
                        <div className="card-body">
                            <h4>Highest Salary</h4>
                            <h2>{formatCurrency(highestSalary)}</h2>
                            <small>Maximum pay</small>
                        </div>
                    </Card>

                    <Card>
                        <div className="card-body">
                            <h4>Total Payroll</h4>
                            <h2>{formatCurrency(totalPayroll)}</h2>
                            <small>Annual payroll</small>
                        </div>
                    </Card>
                </div>

                {/* Department Report — internally scrollable so it never pushes the page height */}
                <h3>Department Report</h3>

                {departmentReport.length === 0 ? (
                    <Card>
                        <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                            <p className="text-muted" style={{ marginBottom: 0 }}>No department data available yet.</p>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="dashboard-report-scroll table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Department</th>
                                        <th>Employees</th>
                                        <th>Average Salary</th>
                                        <th>Total Payroll</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departmentReport.map((item) => (
                                        <tr key={item.department}>
                                            <td><strong>{item.department}</strong></td>
                                            <td>
                                                <span className="badge badge-primary">
                                                    {item.totalEmployees}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(Math.round(item.averageSalary))}</td>
                                            <td>{formatCurrency(item.totalEmployees * Math.round(item.averageSalary))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="dashboard-quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                        <a href="/add-employee" className="btn btn-primary">Add Employee</a>
                        <a href="/create-user" className="btn btn-primary">Create User</a>
                        <a href="/employees" className="btn btn-primary">View Employees</a>
                        <a href="/attendance" className="btn btn-primary">Manage Attendance</a>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Dashboard;