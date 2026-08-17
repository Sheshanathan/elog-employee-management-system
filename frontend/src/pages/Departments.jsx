import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { ConfirmationModal, StatusBadge, LoadingSpinner, EmptyState, ResultsSummary, RowActionsMenu } from "../components/FormField";
import { getDesignationName } from "../utils/designation";
import { matchesSearch } from "../utils/search";
import { toast } from "react-toastify";
import '../styles/design-system.css';
import { downloadCSV } from "../utils/csv";
function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Active");
    const [formErrors, setFormErrors] = useState({});

    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentEmployees, setDepartmentEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        department: null
    });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const handleExport = () => {
    downloadCSV("departments", filteredDepartments, [
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" },
    ]);
};

    const role = localStorage.getItem("role");

    async function fetchDepartments() {
        setLoading(true);

        try {
            const response = await api.get("/departments");
            setDepartments(response.data || []);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load departments"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDepartments();
    }, []);

    async function viewEmployees(department) {
        setSelectedDepartment(department);
        setEmployeesLoading(true);

        try {
            const response = await api.get(
                `/departments/${department._id}/employees`
            );

            setDepartmentEmployees(response.data);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load department employees"
            );
        } finally {
            setEmployeesLoading(false);
        }
    }

    function closeEmployees() {
        setSelectedDepartment(null);
        setDepartmentEmployees([]);
    }

    function resetForm() {
        setName("");
        setDescription("");
        setStatus("Active");
        setFormErrors({});
        setEditingDepartment(null);
        setShowForm(false);
    }

    function handleEdit(department) {
        setEditingDepartment(department);
        setName(department.name);
        setDescription(department.description || "");
        setStatus(department.status);
        setFormErrors({});
        setShowForm(true);
    }

    function validateForm() {
        const errors = {};

        if (!name.trim()) {
            errors.name = "Department name is required";
        } else if (name.trim().length < 2) {
            errors.name = "Department name must contain at least 2 characters";
        } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
            errors.name = "Department name should contain only letters and spaces";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                status
            };

            if (editingDepartment) {
                await api.put(
                    `/departments/${editingDepartment._id}`,
                    payload
                );

                toast.success("Department Updated Successfully");
            } else {
                await api.post("/departments", payload);
                toast.success("Department Created Successfully");
            }

            resetForm();
            fetchDepartments();
        } catch (error) {
            const apiErrors = error.response?.data?.errors;

            if (apiErrors) {
                setFormErrors(apiErrors);
            }

            toast.error(
                error.response?.data?.message ||
                "Something went wrong"
            );
        }
    }

    function handleDeleteClick(department) {
        setDeleteConfirm({
            isOpen: true,
            department
        });
    }

    async function handleDeleteConfirm() {
        if (!deleteConfirm.department) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete(
                `/departments/${deleteConfirm.department._id}`
            );

            toast.success("Department Deleted Successfully");
            setDeleteConfirm({ isOpen: false, department: null });
            fetchDepartments();

            if (selectedDepartment?._id === deleteConfirm.department._id) {
                closeEmployees();
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to delete department"
            );
        } finally {
            setDeleteLoading(false);
        }
    }

    async function toggleStatus(department) {
        const newStatus =
            department.status === "Active"
                ? "Inactive"
                : "Active";

        try {
            await api.patch(
                `/departments/${department._id}/status`,
                { status: newStatus }
            );

            toast.success(`Department ${newStatus} Successfully`);
            fetchDepartments();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to update department status"
            );
        }
    }

    const filteredDepartments = (departments || []).filter((department) =>
        matchesSearch(search, department.name)
    );

    const columnCount = role === "Admin" ? 4 : 3;

    return (
        <Layout>
            <div className="departments-page">
                <div className="page-header">
    <div className="page-title-section">
        <h1>Departments</h1>
        <p>Manage organization departments</p>
    </div>
    <div className="page-actions">
        <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
        </button>
        {role === "Admin" && (
            <button
                className="btn btn-primary"
                onClick={() => {
                    resetForm();
                    setShowForm(true);
                }}
            >
                Add Department
            </button>
        )}
    </div>
</div>

                <div className="department-filters">
                    <input
                        type="text"
                        placeholder="Search Department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-box"
                    />
                </div>

                {showForm && role === "Admin" && (
                    <div className="department-form card">
                        <h2>
                            {editingDepartment
                                ? "Edit Department"
                                : "Add Department"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="department-name" className="form-label required">
                                    Department Name
                                </label>
                                <input
                                    id="department-name"
                                    type="text"
                                    value={name}
                                    placeholder="Enter Department Name"
                                    className={formErrors.name ? "is-invalid" : ""}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {formErrors.name && (
                                    <div className="form-error">{formErrors.name}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="department-description" className="form-label">
                                    Description
                                </label>
                                <textarea
                                    id="department-description"
                                    value={description}
                                    placeholder="Enter Department Description (optional)"
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="department-status" className="form-label required">
                                    Status
                                </label>
                                <select
                                    id="department-status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingDepartment
                                        ? "Update Department"
                                        : "Create Department"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {!loading && departments.length > 0 && (
                    <ResultsSummary
                        shown={filteredDepartments.length}
                        total={departments.length}
                        label="departments"
                    />
                )}

                {loading ? (
                    <LoadingSpinner />
                ) : departments.length === 0 ? (
                    <EmptyState
                        title="No Departments Found"
                        message="Create your first department to assign employees."
                        action={
                            role === "Admin"
                                ? () => {
                                    resetForm();
                                    setShowForm(true);
                                }
                                : null
                        }
                        actionText="Add Department"
                    />
                ) : (
                    <div className="department-table-wrapper department-table-wrapper--fit">
                        <table className={`department-table department-list-table${role === "Admin" ? " department-list-table--admin" : ""}`}>
                            <thead>
                                <tr>
                                    <th className="col-name">Name</th>
                                    <th className="col-desc">Description</th>
                                    <th className="col-status col-badge">Status</th>
                                    {role === "Admin" && <th className="col-actions">Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredDepartments.length === 0 ? (
                                    <tr>
                                        <td colSpan={columnCount} className="table-empty-message">
                                            No departments match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDepartments.map((department) => (
                                        <tr key={department._id}>
                                            <td className="col-name cell-ellipsis" title={department.name}>{department.name}</td>
                                            <td className="col-desc cell-ellipsis" title={department.description || "N/A"}>{department.description || "N/A"}</td>
                                            <td className="col-status cell-badge cell-nowrap">
                                                <StatusBadge status={department.status} />
                                            </td>

                                            {role === "Admin" && (
                                                <td className="col-actions cell-actions">
                                                    <RowActionsMenu
                                                        ariaLabel={`Actions for ${department.name}`}
                                                        items={[
                                                            {
                                                                key: 'edit',
                                                                label: 'Edit',
                                                                onClick: () => handleEdit(department),
                                                            },
                                                            {
                                                                key: 'toggle',
                                                                label: department.status === 'Active' ? 'Deactivate' : 'Activate',
                                                                onClick: () => toggleStatus(department),
                                                            },
                                                            {
                                                                key: 'employees',
                                                                label: 'View Employees',
                                                                onClick: () => viewEmployees(department),
                                                            },
                                                            {
                                                                key: 'delete',
                                                                label: 'Delete',
                                                                danger: true,
                                                                onClick: () => handleDeleteClick(department),
                                                            },
                                                        ]}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedDepartment && (
                            <div className="department-employees">
                                <div className="page-header">
                                    <h2>
                                        Employees — {selectedDepartment.name}
                                    </h2>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={closeEmployees}
                                    >
                                        Close
                                    </button>
                                </div>

                                {employeesLoading ? (
                                    <LoadingSpinner />
                                ) : departmentEmployees.length === 0 ? (
                                    <p>No employees found in this department.</p>
                                ) : (
                                    <table className="department-table department-list-table department-list-table--nested">
                                        <thead>
                                            <tr>
                                                <th className="col-id">Employee ID</th>
                                                <th className="col-name">Name</th>
                                                <th className="col-desig">Designation</th>
                                                <th className="col-date">Joining Date</th>
                                                <th className="col-status col-badge">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {departmentEmployees.map((employee) => {
                                                const designationName = getDesignationName(employee.designation);

                                                return (
                                                <tr key={employee._id}>
                                                    <td className="col-id cell-nowrap">{employee.employeeId}</td>
                                                    <td className="col-name cell-ellipsis" title={employee.name}>{employee.name}</td>
                                                    <td className="col-desig cell-ellipsis" title={designationName}>{designationName}</td>
                                                    <td className="col-date cell-nowrap">
                                                        {employee.joiningDate
                                                            ? new Date(employee.joiningDate).toLocaleDateString()
                                                            : "—"}
                                                    </td>
                                                    <td className="col-status cell-badge cell-nowrap">
                                                        <StatusBadge status={employee.status} />
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                )}

                <ConfirmationModal
                    isOpen={deleteConfirm.isOpen}
                    title="Delete Department?"
                    message={`Are you sure you want to delete "${deleteConfirm.department?.name}"?`}
                    warning="This department cannot be deleted if employees are currently assigned to it. Deactivate the department instead if you want to stop assigning new employees."
                    confirmText="Delete Department"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteConfirm({ isOpen: false, department: null })}
                    isLoading={deleteLoading}
                    isDangerous={true}
                />
            </div>
        </Layout>
    );
}

export default Departments;
