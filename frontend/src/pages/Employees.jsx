import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ConfirmationModal, StatusBadge, LoadingSpinner, ResultsSummary, RowActionsMenu } from "../components/FormField";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import { matchesSearch } from "../utils/search";
import { formatCurrency } from "../utils/currency";
import '../styles/design-system.css';

function formatShortDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
    });
}

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, employeeId: null, employeeName: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const employeesPerPage = 10;
    const navigate = useNavigate();
    const role = localStorage.getItem("role");

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const response = await api.get("/employees");
            setEmployees(response.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (employeeId, employeeName) => {
        setDeleteConfirm({
            isOpen: true,
            employeeId,
            employeeName
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.employeeId) return;

        setDeleteLoading(true);
        try {
            await api.delete(`/employees/${deleteConfirm.employeeId}`);
            toast.success("Employee deleted successfully");
            setEmployees(prev => prev.filter(e => e._id !== deleteConfirm.employeeId));
            setDeleteConfirm({ isOpen: false, employeeId: null, employeeName: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete employee");
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredEmployees = (employees || []).filter((employee) => {
        const matchesSearchQuery = matchesSearch(
            search,
            employee.name,
            employee.employeeId,
            getDepartmentName(employee.department),
            getDesignationName(employee.designation)
        );

        const matchesStatus = statusFilter === "All" || employee.status === statusFilter;

        return matchesSearchQuery && matchesStatus;
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredEmployees.length / employeesPerPage)
    );
    const safePage = Math.min(currentPage, totalPages);
    const indexOfLastEmployee = safePage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1>Employees</h1>
                    <p>Manage employee records</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/add-employee')}>
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="filters-row">
                    <div className="filter-field">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="search-box-sm"
                            placeholder="Name, ID, department..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="filter-field">
                        <label className="form-label">Status</label>
                        <select
                            className="filter-select-sm"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <ResultsSummary
                shown={currentEmployees.length}
                total={filteredEmployees.length}
                label="employees"
            />

            {/* Table */}
            {filteredEmployees.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-16)' }}>
                    <p className="text-muted" style={{ marginBottom: 0 }}>No employees found</p>
                </div>
            ) : (
                <div className="card employees-card">
                    <div className="table-responsive table-responsive-fit">
                        <table className={`employees-table${role === "Admin" ? " employees-table--admin" : ""}`}>
                            <thead>
                                <tr>
                                    <th className="col-id">ID</th>
                                    <th className="col-name">Name</th>
                                    <th className="col-dept">Department</th>
                                    <th className="col-desig">Designation</th>
                                    <th className="col-date">Joined</th>
                                    <th className="col-salary">Salary</th>
                                    <th className="col-status col-badge">Status</th>
                                    {role === "Admin" && <th className="col-actions">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {currentEmployees.map((employee) => {
                                    const departmentName = getDepartmentName(employee.department);
                                    const designationName = getDesignationName(employee.designation);

                                    return (
                                    <tr key={employee._id}>
                                        <td className="cell-nowrap col-id"><strong>{employee.employeeId}</strong></td>
                                        <td className="cell-ellipsis col-name" title={employee.name}>{employee.name}</td>
                                        <td className="cell-ellipsis col-dept" title={departmentName}>{departmentName}</td>
                                        <td className="cell-ellipsis col-desig" title={designationName}>{designationName}</td>
                                        <td className="cell-nowrap col-date">{formatShortDate(employee.joiningDate)}</td>
                                        <td className="cell-nowrap col-salary">{formatCurrency(employee.salary)}</td>
                                        <td className="cell-nowrap col-status cell-badge"><StatusBadge status={employee.status} /></td>
                                        {role === "Admin" && (
                                            <td className="cell-actions col-actions">
                                                <RowActionsMenu
                                                    ariaLabel={`Actions for ${employee.name}`}
                                                    items={[
                                                        {
                                                            key: 'view',
                                                            label: 'View',
                                                            onClick: () => navigate(`/employee/${employee._id}`),
                                                        },
                                                        {
                                                            key: 'edit',
                                                            label: 'Edit',
                                                            onClick: () => navigate(`/edit-employee/${employee._id}`),
                                                        },
                                                        {
                                                            key: 'delete',
                                                            label: 'Delete',
                                                            danger: true,
                                                            onClick: () => handleDeleteClick(employee._id, employee.name),
                                                        },
                                                    ]}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="employees-table-pagination">
                        <button
                            className="btn btn-secondary"
                            disabled={safePage === 1}
                            onClick={() => setCurrentPage(safePage - 1)}
                        >
                            Previous
                        </button>
                        <span style={{ minWidth: '120px', textAlign: 'center' }}>
                            Page {safePage} of {totalPages}
                        </span>
                        <button
                            className="btn btn-secondary"
                            disabled={safePage === totalPages}
                            onClick={() => setCurrentPage(safePage + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Employee"
                message={`Are you sure you want to delete ${deleteConfirm.employeeName}?`}
                warning="This action cannot be undone."
                confirmText="Delete Employee"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, employeeId: null, employeeName: '' })}
                isLoading={deleteLoading}
                isDangerous={true}
            />
        </Layout>
    );
}

export default Employees;