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
    const [attendanceData, setAttendanceData] = useState(null);

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

            // Calculate today's attendance stats
            const today = new Date().toISOString().split('T')[0];
            const attendanceStats = {
                present: 0,
                absent: 0,
                onLeave: 0,
                notCheckedIn: empRes.data?.length || 0
            };
            
            setAttendanceData(attendanceStats);
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
            {/* Header */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1>Admin Dashboard</h1>
                    <p>Organization overview and key metrics</p>
                </div>
            </div>

            {/* Key Metrics - Row 1: Employee Count */}
            <h3 style={{ marginTop: 'var(--spacing-8)', marginBottom: 'var(--spacing-4)' }}>
                Employee Overview
            </h3>
            <div className="grid-4">
                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Total Employees
                        </h4>
                        <h2 style={{ margin: 0, color: 'var(--primary-600)' }}>
                            {totalEmployees}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            Across organization
                        </small>
                    </div>
                </Card>

                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Active Employees
                        </h4>
                        <h2 style={{ margin: 0, color: 'var(--success-600)' }}>
                            {activeEmployees}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            {totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% active
                        </small>
                    </div>
                </Card>

                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Inactive Employees
                        </h4>
                        <h2 style={{ margin: 0, color: 'var(--error-600)' }}>
                            {inactiveEmployees}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            Deactivated accounts
                        </small>
                    </div>
                </Card>

                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Departments
                        </h4>
                        <h2 style={{ margin: 0, color: 'var(--secondary-600)' }}>
                            {totalDepartments}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            Organizational units
                        </small>
                    </div>
                </Card>
            </div>

            {/* Key Metrics - Row 2: Salary Stats */}
            <h3 style={{ marginTop: 'var(--spacing-12)', marginBottom: 'var(--spacing-4)' }}>
                Compensation Overview
            </h3>
            <div className="grid-3">
                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Average Salary
                        </h4>
                        <h2 style={{ margin: 0 }}>
                            {formatCurrency(averageSalary)}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            Per employee
                        </small>
                    </div>
                </Card>

                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Highest Salary
                        </h4>
                        <h2 style={{ margin: 0 }}>
                            {formatCurrency(highestSalary)}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            Maximum pay
                        </small>
                    </div>
                </Card>

                <Card>
                    <div className="card-body">
                        <h4 style={{ margin: 0, marginBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                            Total Payroll
                        </h4>
                        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
                            {formatCurrency(totalPayroll)}
                        </h2>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                            Annual payroll
                        </small>
                    </div>
                </Card>
            </div>

            {/* Department Report */}
            <h3 style={{ marginTop: 'var(--spacing-12)', marginBottom: 'var(--spacing-4)' }}>
                Department Report
            </h3>

            {departmentReport.length === 0 ? (
                <Card>
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p className="text-muted">No department data available yet.</p>
                    </div>
                </Card>
            ) : (
                <Card>
                    <div className="table-responsive">
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
                                        <td>
                                            <strong>{item.department}</strong>
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {item.totalEmployees}
                                            </span>
                                        </td>
                                        <td>
                                            {formatCurrency(Math.round(item.averageSalary))}
                                        </td>
                                        <td>
                                            {formatCurrency(item.totalEmployees * Math.round(item.averageSalary))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Quick Actions */}
            <div style={{ marginTop: 'var(--spacing-12)', marginBottom: 'var(--spacing-8)' }}>
                <h3>Quick Actions</h3>
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <a href="/add-employee" className="btn btn-primary">
                        Add Employee
                    </a>
                    <a href="/create-user" className="btn btn-primary">
                        Create User
                    </a>
                    <a href="/employees" className="btn btn-primary">
                        View Employees
                    </a>
                    <a href="/attendance" className="btn btn-primary">
                        Manage Attendance
                    </a>
                </div>
            </div>
        </Layout>
    );
}

export default Dashboard;