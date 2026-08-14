import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import {
    ConfirmationModal,
    StatusBadge,
    LoadingSpinner,
    EmptyState,
    ResultsSummary,
    RowActionsMenu,
} from "../components/FormField";
import { toast } from "react-toastify";
import { getDepartmentName } from "../utils/department";
import { matchesSearch } from "../utils/search";
import "../styles/design-system.css";

function Designations() {
    const [designations, setDesignations] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Active");
    const [formErrors, setFormErrors] = useState({});

    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [designationEmployees, setDesignationEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        designation: null
    });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const role = localStorage.getItem("role");

    async function fetchDesignations() {
        setLoading(true);

        try {
            const response = await api.get("/designations");
            setDesignations(response.data || []);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load designations"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDesignations();
    }, []);

    function resetForm() {
        setName("");
        setDescription("");
        setStatus("Active");
        setFormErrors({});
        setEditingDesignation(null);
        setShowForm(false);
    }

    function handleEdit(designation) {
        setEditingDesignation(designation);
        setName(designation.name);
        setDescription(designation.description || "");
        setStatus(designation.status);
        setFormErrors({});
        setShowForm(true);
    }

    function validateForm() {
        const errors = {};

        if (!name.trim()) {
            errors.name = "Designation name is required";
        } else if (name.trim().length < 2) {
            errors.name = "Designation name must contain at least 2 characters";
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

            if (editingDesignation) {
                await api.put(
                    `/designations/${editingDesignation._id}`,
                    payload
                );

                toast.success("Designation Updated Successfully");
            } else {
                await api.post("/designations", payload);
                toast.success("Designation Created Successfully");
            }

            resetForm();
            fetchDesignations();
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

    async function toggleStatus(designation) {
        const newStatus =
            designation.status === "Active"
                ? "Inactive"
                : "Active";

        try {
            await api.patch(
                `/designations/${designation._id}/status`,
                { status: newStatus }
            );

            toast.success(`Designation ${newStatus} Successfully`);
            fetchDesignations();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to update designation status"
            );
        }
    }

    function handleDeleteClick(designation) {
        setDeleteConfirm({
            isOpen: true,
            designation
        });
    }

    async function handleDeleteConfirm() {
        if (!deleteConfirm.designation) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete(
                `/designations/${deleteConfirm.designation._id}`
            );

            toast.success("Designation Deleted Successfully");
            setDeleteConfirm({ isOpen: false, designation: null });
            fetchDesignations();

            if (selectedDesignation?._id === deleteConfirm.designation._id) {
                closeEmployees();
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to delete designation"
            );
        } finally {
            setDeleteLoading(false);
        }
    }

    async function viewEmployees(designation) {
        setSelectedDesignation(designation);
        setEmployeesLoading(true);

        try {
            const response = await api.get(
                `/designations/${designation._id}/employees`
            );

            setDesignationEmployees(response.data);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load designation employees"
            );
        } finally {
            setEmployeesLoading(false);
        }
    }

    function closeEmployees() {
        setSelectedDesignation(null);
        setDesignationEmployees([]);
    }

    const filteredDesignations = (designations || []).filter((designation) =>
        matchesSearch(search, designation.name)
    );

    const columnCount = role === "Admin" ? 4 : 3;

    return (
        <Layout>
            <div className="departments-page">
                <div className="page-header">
                    <div className="page-title-section">
                        <h1>Designations</h1>
                        <p>Manage employee role designations</p>
                    </div>

                    {role === "Admin" && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            Add Designation
                        </button>
                    )}
                </div>

                <div className="department-filters">
                    <input
                        type="text"
                        placeholder="Search Designation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-box"
                    />
                </div>

                {showForm && role === "Admin" && (
                    <div className="department-form card">
                        <h2>
                            {editingDesignation
                                ? "Edit Designation"
                                : "Add Designation"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="designation-name" className="form-label required">
                                    Designation Name
                                </label>
                                <input
                                    id="designation-name"
                                    type="text"
                                    value={name}
                                    placeholder="Enter Designation Name"
                                    className={formErrors.name ? "input-error" : ""}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {formErrors.name && (
                                    <div className="form-error">{formErrors.name}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="designation-description" className="form-label">
                                    Description
                                </label>
                                <textarea
                                    id="designation-description"
                                    value={description}
                                    placeholder="Enter Designation Description"
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="designation-status" className="form-label">
                                    Status
                                </label>
                                <select
                                    id="designation-status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingDesignation
                                        ? "Update Designation"
                                        : "Create Designation"}
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

                {!loading && designations.length > 0 && (
                    <ResultsSummary
                        shown={filteredDesignations.length}
                        total={designations.length}
                        label="designations"
                    />
                )}

                {loading ? (
                    <LoadingSpinner />
                ) : designations.length === 0 ? (
                    <EmptyState
                        title="No Designations Found"
                        message="Create your first designation to assign employee roles."
                        action={
                            role === "Admin"
                                ? () => {
                                    resetForm();
                                    setShowForm(true);
                                }
                                : null
                        }
                        actionText="Add Designation"
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
                                {filteredDesignations.length === 0 ? (
                                    <tr>
                                        <td colSpan={columnCount} className="table-empty-message">
                                            No designations match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDesignations.map((designation) => (
                                        <tr key={designation._id}>
                                            <td className="col-name cell-ellipsis" title={designation.name}>{designation.name}</td>
                                            <td className="col-desc cell-ellipsis" title={designation.description || "N/A"}>{designation.description || "N/A"}</td>
                                            <td className="col-status cell-badge cell-nowrap">
                                                <StatusBadge status={designation.status} />
                                            </td>

                                            {role === "Admin" && (
                                                <td className="col-actions cell-actions">
                                                    <RowActionsMenu
                                                        ariaLabel={`Actions for ${designation.name}`}
                                                        items={[
                                                            {
                                                                key: 'edit',
                                                                label: 'Edit',
                                                                onClick: () => handleEdit(designation),
                                                            },
                                                            {
                                                                key: 'toggle',
                                                                label: designation.status === 'Active' ? 'Deactivate' : 'Activate',
                                                                onClick: () => toggleStatus(designation),
                                                            },
                                                            {
                                                                key: 'employees',
                                                                label: 'View Employees',
                                                                onClick: () => viewEmployees(designation),
                                                            },
                                                            {
                                                                key: 'delete',
                                                                label: 'Delete',
                                                                danger: true,
                                                                onClick: () => handleDeleteClick(designation),
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

                {selectedDesignation && (
                    <div className="department-employees">
                        <div className="page-header">
                            <h2>
                                Employees — {selectedDesignation.name}
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
                        ) : designationEmployees.length === 0 ? (
                            <p>No employees found with this designation.</p>
                        ) : (
                            <table className="department-table department-list-table department-list-table--nested">
                                <thead>
                                    <tr>
                                        <th className="col-id">Employee ID</th>
                                        <th className="col-name">Name</th>
                                        <th className="col-dept">Department</th>
                                        <th className="col-date">Joining Date</th>
                                        <th className="col-status col-badge">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {designationEmployees.map((employee) => {
                                        const departmentName = getDepartmentName(employee.department);

                                        return (
                                        <tr key={employee._id}>
                                            <td className="col-id cell-nowrap">{employee.employeeId}</td>
                                            <td className="col-name cell-ellipsis" title={employee.name}>{employee.name}</td>
                                            <td className="col-dept cell-ellipsis" title={departmentName}>{departmentName}</td>
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
                    title="Delete Designation"
                    message={`Are you sure you want to delete "${deleteConfirm.designation?.name}"?`}
                    warning="This designation cannot be deleted if employees are currently assigned to it. Deactivate the designation instead if you want to stop assigning new employees."
                    confirmText="Delete Designation"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteConfirm({ isOpen: false, designation: null })}
                    isLoading={deleteLoading}
                    isDangerous={true}
                />
            </div>
        </Layout>
    );
}

export default Designations;
