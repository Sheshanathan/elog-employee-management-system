import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import {
    Card,
    ConfirmationModal,
    LoadingSpinner,
    ResultsSummary,
    RowActionsMenu,
    StatusBadge,
} from "../components/FormField";
import { matchesSearch } from "../utils/search";
import "../styles/design-system.css";

const LEAVE_TYPES = [
    "Casual Leave",
    "Sick Leave",
    "Earned Leave",
    "Unpaid Leave",
    "Optional Holiday",
];

function formatDate(date) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function LeaveManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [leaves, setLeaves] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [fromDateFilter, setFromDateFilter] = useState("");
    const [toDateFilter, setToDateFilter] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showApproveForm, setShowApproveForm] = useState(false);
    const [showAdminCancelForm, setShowAdminCancelForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [approveRemark, setApproveRemark] = useState("");
    const [adminCancelRemark, setAdminCancelRemark] = useState("");
    const [rejectError, setRejectError] = useState("");
    const [adminCancelConfirm, setAdminCancelConfirm] = useState({
        isOpen: false,
        leaveId: null,
        label: "",
    });
    const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    leaveId: null,
    label: "",
    });

    const leavesPerPage = 10;

    useEffect(() => {
        async function loadDepartments() {
            try {
                const response = await api.get("/departments");
                setDepartments(Array.isArray(response.data) ? response.data : []);
            } catch {
                setDepartments([]);
            }
        }

        loadDepartments();
    }, []);

    useEffect(() => {
        fetchLeaveData();
    }, [statusFilter, leaveTypeFilter, departmentFilter, fromDateFilter, toDateFilter]);

    useEffect(() => {
        const leaveId = searchParams.get("leaveId");
        if (!leaveId || leaves.length === 0) {
            return;
        }

        const matchedLeave = leaves.find((leave) => leave._id === leaveId);
        if (matchedLeave) {
            openDetails(matchedLeave);
            setSearchParams({}, { replace: true });
        }
    }, [leaves, searchParams, setSearchParams]);

    async function fetchLeaveData() {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);
            if (leaveTypeFilter) params.append("leaveType", leaveTypeFilter);
            if (departmentFilter) params.append("department", departmentFilter);
            if (fromDateFilter) params.append("fromDate", fromDateFilter);
            if (toDateFilter) params.append("toDate", toDateFilter);

            const queryString = params.toString();
            const leavesUrl = queryString ? `/leaves?${queryString}` : "/leaves";

            const [leavesResponse, summaryResponse] = await Promise.all([
                api.get(leavesUrl),
                api.get("/leaves/summary"),
            ]);

            setLeaves(leavesResponse.data || []);
            setSummary(summaryResponse.data);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load leave requests"
            );
        } finally {
            setLoading(false);
        }
    }

    const filteredLeaves = leaves.filter((leave) =>
        matchesSearch(
            search,
            leave.employee?.name,
            leave.employee?.employeeId,
            leave.leaveType,
            leave.reason
        )
    );

    const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / leavesPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const indexOfLast = safePage * leavesPerPage;
    const indexOfFirst = indexOfLast - leavesPerPage;
    const currentLeaves = filteredLeaves.slice(indexOfFirst, indexOfLast);

    function clearFilters() {
        setStatusFilter("");
        setLeaveTypeFilter("");
        setDepartmentFilter("");
        setFromDateFilter("");
        setToDateFilter("");
        setSearch("");
        setCurrentPage(1);
    }

    function openDetails(leave) {
        setSelectedLeave(leave);
        setShowDetails(true);
    }

    function closeDetails() {
        setShowDetails(false);
        setSelectedLeave(null);
    }

    function openRejectForm(leave) {
        setSelectedLeave(leave);
        setRejectionReason("");
        setRejectError("");
        setShowRejectForm(true);
    }

    function closeRejectForm() {
        if (actionLoading) return;
        setShowRejectForm(false);
        setRejectionReason("");
        setRejectError("");
    }

    function openApproveForm(leave) {
        setSelectedLeave(leave);
        setApproveRemark("");
        setShowApproveForm(true);
    }

    function closeApproveForm() {
        if (actionLoading) return;
        setShowApproveForm(false);
        setApproveRemark("");
    }

    async function handleApproveWithRemark(event) {
        event.preventDefault();

        if (!selectedLeave) {
            return;
        }

        try {
            setActionLoading(true);
            const payload = approveRemark.trim()
                ? { adminRemark: approveRemark.trim() }
                : {};

            await api.patch(`/leaves/${selectedLeave._id}/approve`, payload);
            toast.success("Leave request approved successfully");
            closeApproveForm();
            closeDetails();
            await fetchLeaveData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve leave request");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReject(event) {
        event.preventDefault();
        const cleanedReason = rejectionReason.trim();

        if (!cleanedReason) {
            setRejectError("Rejection reason is required");
            return;
        }
        if (cleanedReason.length < 3) {
            setRejectError("Rejection reason must contain at least 3 characters");
            return;
        }
        if (cleanedReason.length > 500) {
            setRejectError("Rejection reason cannot exceed 500 characters");
            return;
        }

        try {
            setActionLoading(true);
            await api.patch(`/leaves/${selectedLeave._id}/reject`, {
                rejectionReason: cleanedReason,
            });
            toast.success("Leave request rejected successfully");
            closeRejectForm();
            closeDetails();
            await fetchLeaveData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject leave request");
        } finally {
            setActionLoading(false);
        }
    }

    function openAdminCancelForm(leave) {
        setSelectedLeave(leave);
        setAdminCancelRemark("");
        setShowAdminCancelForm(true);
    }

    function closeAdminCancelForm() {
        if (actionLoading) return;
        setShowAdminCancelForm(false);
        setAdminCancelRemark("");
    }

    function handleAdminCancelClick(leave) {
        setAdminCancelConfirm({
            isOpen: true,
            leaveId: leave._id,
            label: `${leave.employee?.name || "Employee"} • ${leave.leaveType} • ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)}`,
        });
    }

    async function handleAdminCancelConfirm() {
        if (!adminCancelConfirm.leaveId) {
            return;
        }

        try {
            setActionLoading(true);
            const payload = adminCancelRemark.trim()
                ? { adminRemark: adminCancelRemark.trim() }
                : {};

            await api.patch(`/leaves/${adminCancelConfirm.leaveId}/admin-cancel`, payload);
            toast.success("Leave request cancelled successfully");
            setAdminCancelConfirm({ isOpen: false, leaveId: null, label: "" });
            closeAdminCancelForm();
            closeDetails();
            await fetchLeaveData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel leave request");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleAdminCancelSubmit(event) {
        event.preventDefault();

        if (!selectedLeave) {
            return;
        }

        try {
            setActionLoading(true);
            const payload = adminCancelRemark.trim()
                ? { adminRemark: adminCancelRemark.trim() }
                : {};

            await api.patch(`/leaves/${selectedLeave._id}/admin-cancel`, payload);
            toast.success("Leave request cancelled successfully");
            closeAdminCancelForm();
            closeDetails();
            await fetchLeaveData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel leave request");
        } finally {
            setActionLoading(false);
        }
    }
    function handleDeleteClick(leave) {
    setDeleteConfirm({
        isOpen: true,
        leaveId: leave._id,
        label: `${leave.employee?.name || "Employee"} • ${leave.leaveType} • ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)}`,
    });
}

function closeDeleteConfirm() {
    if (actionLoading) return;

    setDeleteConfirm({
        isOpen: false,
        leaveId: null,
        label: "",
    });
}

async function handleDeleteConfirm() {
    if (!deleteConfirm.leaveId) return;

    try {
        setActionLoading(true);

        await api.delete(`/leaves/${deleteConfirm.leaveId}`);

        toast.success("Leave record permanently deleted");

        setDeleteConfirm({
            isOpen: false,
            leaveId: null,
            label: "",
        });

        closeDetails();

        await fetchLeaveData();

    } catch (error) {
        toast.error(
            error.response?.data?.message ||
            "Failed to delete leave record"
        );
    } finally {
        setActionLoading(false);
    }
}

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
                    <h1>Leave Management</h1>
                    <p>Review, approve, and manage employee leave requests</p>
                </div>
            </div>

            {summary && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "var(--spacing-4)",
                        marginBottom: "var(--spacing-6)",
                    }}
                >
                    <Card>
                        <div className="card-body">
                            <h4>Total</h4>
                            <h2 className="dashboard-stat-value dashboard-stat-primary">{summary.total}</h2>
                        </div>
                    </Card>
                    <Card>
                        <div className="card-body">
                            <h4>Pending</h4>
                            <h2 className="dashboard-stat-value dashboard-stat-info">{summary.pending}</h2>
                        </div>
                    </Card>
                    <Card>
                        <div className="card-body">
                            <h4>Approved</h4>
                            <h2 className="dashboard-stat-value dashboard-stat-success">{summary.approved}</h2>
                        </div>
                    </Card>
                    <Card>
                        <div className="card-body">
                            <h4>Rejected</h4>
                            <h2 className="dashboard-stat-value dashboard-stat-error">{summary.rejected}</h2>
                        </div>
                    </Card>
                    <Card>
                        <div className="card-body">
                            <h4>Cancelled</h4>
                            <h2 className="dashboard-stat-value">{summary.cancelled}</h2>
                        </div>
                    </Card>
                </div>
            )}

            <div className="filters-row filters-row--plain">
                <div className="filter-field">
                    <label className="form-label">Search</label>
                    <input
                        type="text"
                        className="search-box-sm"
                        placeholder="Employee name, ID, or reason..."
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="filter-field">
                    <label className="form-label">Status</label>
                    <select
                        className="filter-select-sm"
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="filter-field">
                    <label className="form-label">Leave Type</label>
                    <select
                        className="filter-select-sm filter-select-sm--wide"
                        value={leaveTypeFilter}
                        onChange={(event) => {
                            setLeaveTypeFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Leave Types</option>
                        {LEAVE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-field">
                    <label className="form-label">Department</label>
                    <select
                        className="filter-select-sm filter-select-sm--wide"
                        value={departmentFilter}
                        onChange={(event) => {
                            setDepartmentFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Departments</option>
                        {departments.map((department) => (
                            <option key={department._id} value={department._id}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-field">
                    <label className="form-label">From Date</label>
                    <input
                        type="date"
                        className="search-box-sm"
                        value={fromDateFilter}
                        onChange={(event) => {
                            setFromDateFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="filter-field">
                    <label className="form-label">To Date</label>
                    <input
                        type="date"
                        className="search-box-sm"
                        value={toDateFilter}
                        min={fromDateFilter || undefined}
                        onChange={(event) => {
                            setToDateFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="filter-field" style={{ alignSelf: "flex-end" }}>
                    <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            </div>

            <ResultsSummary
                shown={currentLeaves.length}
                total={filteredLeaves.length}
                label="requests"
            />

            {filteredLeaves.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "var(--spacing-16)" }}>
                    <p className="text-muted" style={{ marginBottom: 0 }}>
                        No leave requests found.
                    </p>
                </Card>
            ) : (
                <Card className="app-table-card">
                    <div className="table-responsive table-responsive-fit">
                        <table className="app-data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Days</th>
                                    <th>Applied</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLeaves.map((leave) => (
                                    <tr key={leave._id}>
                                        <td className="cell-text">
                                            <strong>{leave.employee?.name || "—"}</strong>
                                            <br />
                                            <small className="text-muted">{leave.employee?.employeeId || "—"}</small>
                                        </td>
                                        <td className="cell-nowrap">{leave.leaveType}</td>
                                        <td className="cell-nowrap">{formatDate(leave.fromDate)}</td>
                                        <td className="cell-nowrap">{formatDate(leave.toDate)}</td>
                                        <td className="cell-nowrap">{leave.days}</td>
                                        <td className="cell-nowrap">{formatDate(leave.createdAt)}</td>
                                        <td className="cell-badge">
                                            <StatusBadge status={leave.status} />
                                        </td>
                                        <td className="cell-actions">
                                            <RowActionsMenu
                                                ariaLabel={`Actions for ${leave.employee?.name || "leave request"}`}
                                                items={[
                                                    {
                                                        key: "view",
                                                        label: "View Details",
                                                        onClick: () => openDetails(leave),
                                                    },
                                                    ...(leave.status === "Pending"
                                                        ? [
                                                            {
                                                                key: "approve",
                                                                label: "Approve",
                                                                onClick: () => openApproveForm(leave),
                                                            },
                                                            {
                                                                key: "reject",
                                                                label: "Reject",
                                                                danger: true,
                                                                onClick: () => openRejectForm(leave),
                                                            },
                                                        ]
                                                        : []),
                                                    ...( ["Pending", "Approved"].includes(leave.status)
                                                        ? [{
                                                            key: "cancel",
                                                            label: "Cancel Leave",
                                                            danger: true,
                                                            onClick: () => handleAdminCancelClick(leave),
                                                        }]
                                                        : []),
                                                        ...( ["Cancelled", "Rejected"].includes(leave.status)
                                                        ? [
                                                            {
                                                                key: "delete",
                                                                label: "Delete Record",
                                                                danger: true,
                                                                onClick: () => handleDeleteClick(leave),
                                                            },
                                                        ]
                                                        : []
                                                    ),
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="app-table-pagination">
                        <button
                            className="btn btn-secondary"
                            disabled={safePage === 1}
                            onClick={() => setCurrentPage(safePage - 1)}
                        >
                            Previous
                        </button>
                        <span style={{ minWidth: "120px", textAlign: "center" }}>
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
                </Card>
            )}

            {showDetails && selectedLeave && (
                <div className="modal-overlay" onClick={closeDetails}>
                    <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Leave Details</h2>
                        </div>
                        <div className="modal-body">
                            <p><strong>Employee:</strong> {selectedLeave.employee?.name || "—"}</p>
                            <p><strong>Employee ID:</strong> {selectedLeave.employee?.employeeId || "—"}</p>
                            <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                            <p><strong>From:</strong> {formatDate(selectedLeave.fromDate)}</p>
                            <p><strong>To:</strong> {formatDate(selectedLeave.toDate)}</p>
                            <p><strong>Days:</strong> {selectedLeave.days}</p>
                            <p><strong>Applied:</strong> {formatDate(selectedLeave.createdAt)}</p>
                            <p><strong>Status:</strong> <StatusBadge status={selectedLeave.status} /></p>
                            <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                            {selectedLeave.rejectionReason && (
                                <p><strong>Rejection Reason:</strong> {selectedLeave.rejectionReason}</p>
                            )}
                            {selectedLeave.adminRemark && (
                                <p><strong>Admin Remark:</strong> {selectedLeave.adminRemark}</p>
                            )}
                            {selectedLeave.approvedBy && (
                                <p><strong>Reviewed By:</strong> {selectedLeave.approvedBy.name}</p>
                            )}
                            {selectedLeave.approvedAt && (
                                <p><strong>Reviewed At:</strong> {formatDate(selectedLeave.approvedAt)}</p>
                            )}
                            {selectedLeave.cancelledBy && (
                                <p><strong>Cancelled By:</strong> {selectedLeave.cancelledBy.name}</p>
                            )}
                            {selectedLeave.cancelledAt && (
                                <p><strong>Cancelled At:</strong> {formatDate(selectedLeave.cancelledAt)}</p>
                            )}
                            {selectedLeave.updatedAt && (
                                <p><strong>Last Updated:</strong> {formatDate(selectedLeave.updatedAt)}</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            {selectedLeave.status === "Pending" && (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={actionLoading}
                                        onClick={() => openApproveForm(selectedLeave)}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        disabled={actionLoading}
                                        onClick={() => openRejectForm(selectedLeave)}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {["Pending", "Approved"].includes(selectedLeave.status) && (
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    disabled={actionLoading}
                                    onClick={() => openAdminCancelForm(selectedLeave)}
                                >
                                    Cancel Leave
                                </button>
                            )}
                            {["Cancelled", "Rejected"].includes(selectedLeave.status) && (
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    disabled={actionLoading}
                                    onClick={() => handleDeleteClick(selectedLeave)}
                                >
                                    Delete Record
                                </button>
                            )}
                            <button type="button" className="btn btn-secondary" onClick={closeDetails}>
                                Close
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {showApproveForm && selectedLeave && (
                <div className="modal-overlay" onClick={closeApproveForm}>
                    <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Approve Leave Request</h2>
                        </div>
                        <form onSubmit={handleApproveWithRemark}>
                            <div className="modal-body">
                                <p>
                                    Approving leave for <strong>{selectedLeave.employee?.name}</strong>
                                </p>
                                <div className="form-field">
                                    <label className="form-label" htmlFor="approveRemark">
                                        Admin Remark (optional)
                                    </label>
                                    <textarea
                                        id="approveRemark"
                                        className="form-input"
                                        rows="3"
                                        maxLength="500"
                                        value={approveRemark}
                                        onChange={(event) => setApproveRemark(event.target.value)}
                                        placeholder="Optional remark for the employee"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={actionLoading}
                                    onClick={closeApproveForm}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-primary${actionLoading ? " is-loading" : ""}`}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Approving..." : "Approve Leave"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRejectForm && selectedLeave && (
                <div className="modal-overlay" onClick={closeRejectForm}>
                    <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Reject Leave Request</h2>
                        </div>
                        <form onSubmit={handleReject}>
                            <div className="modal-body">
                                <p>
                                    Rejecting leave for <strong>{selectedLeave.employee?.name}</strong>
                                </p>
                                <div className="form-field">
                                    <label className="form-label" htmlFor="rejectionReason">
                                        Rejection Reason
                                    </label>
                                    <textarea
                                        id="rejectionReason"
                                        className={rejectError ? "is-invalid" : undefined}
                                        rows="4"
                                        maxLength="500"
                                        value={rejectionReason}
                                        onChange={(event) => {
                                            setRejectionReason(event.target.value);
                                            setRejectError("");
                                        }}
                                        placeholder="Enter reason for rejecting this leave"
                                    />
                                    {rejectError && (
                                        <span className="form-error">{rejectError}</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={actionLoading}
                                    onClick={closeRejectForm}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-danger${actionLoading ? " is-loading" : ""}`}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Rejecting..." : "Reject Leave"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminCancelForm && selectedLeave && (
                <div className="modal-overlay" onClick={closeAdminCancelForm}>
                    <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Cancel Leave Request</h2>
                        </div>
                        <form onSubmit={handleAdminCancelSubmit}>
                            <div className="modal-body">
                                <p>
                                    Cancelling leave for <strong>{selectedLeave.employee?.name}</strong>
                                </p>
                                <div className="form-field">
                                    <label className="form-label" htmlFor="adminCancelRemark">
                                        Admin Remark (optional)
                                    </label>
                                    <textarea
                                        id="adminCancelRemark"
                                        rows="3"
                                        maxLength="500"
                                        value={adminCancelRemark}
                                        onChange={(event) => setAdminCancelRemark(event.target.value)}
                                        placeholder="Optional remark for the employee"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={actionLoading}
                                    onClick={closeAdminCancelForm}
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-danger${actionLoading ? " is-loading" : ""}`}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Cancelling..." : "Cancel Leave"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={adminCancelConfirm.isOpen}
                title="Cancel Leave Request"
                message="Are you sure you want to cancel this leave request?"
                warning={adminCancelConfirm.label}
                confirmText="Cancel Leave"
                cancelText="Keep Request"
                onConfirm={handleAdminCancelConfirm}
                onCancel={() => setAdminCancelConfirm({ isOpen: false, leaveId: null, label: "" })}
                isLoading={actionLoading}
                isDangerous={true}
            />
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Leave Record"
                message="Are you sure you want to permanently delete this leave record?"
                warning={deleteConfirm.label}
                confirmText="Delete Record"
                cancelText="Keep Record"
                onConfirm={handleDeleteConfirm}
                onCancel={closeDeleteConfirm}
                isLoading={actionLoading}
                isDangerous={true}
            />
        </Layout>
    );
}

export default LeaveManagement;
