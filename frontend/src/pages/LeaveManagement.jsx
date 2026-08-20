import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

function LeaveManagement() {
    const [leaves, setLeaves] = useState([]);
    const [summary, setSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [statusFilter, setStatusFilter] = useState("");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("");

    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchLeaveData();
    }, [statusFilter, leaveTypeFilter]);

    async function fetchLeaveData() {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (statusFilter) {
                params.append("status", statusFilter);
            }

            if (leaveTypeFilter) {
                params.append("leaveType", leaveTypeFilter);
            }

            const queryString = params.toString();

            const leavesUrl = queryString
                ? `${API_URL}/leaves?${queryString}`
                : `${API_URL}/leaves`;

            const [leavesResponse, summaryResponse] =
                await Promise.all([
                    api.get(leavesUrl),
                    api.get(`${API_URL}/leaves/summary`)
                ]);

            setLeaves(leavesResponse.data);
            setSummary(summaryResponse.data);

        } catch (error) {
            console.error(
                "Leave Management Error:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                "Failed to load leave requests"
            );
        } finally {
            setLoading(false);
        }
    }

    function clearFilters() {
        setStatusFilter("");
        setLeaveTypeFilter("");
    }

    async function handleApprove(id) {
        const confirmed = window.confirm(
            "Are you sure you want to approve this leave request?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);

            await api.patch(
                `${API_URL}/leaves/${id}/approve`
            );

            toast.success(
                "Leave request approved successfully"
            );

            setShowDetails(false);
            setSelectedLeave(null);

            await fetchLeaveData();

        } catch (error) {
            console.error(
                "Approve Leave Error:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                "Failed to approve leave request"
            );
        } finally {
            setActionLoading(false);
        }
    }

    function openRejectForm(leave) {
        setSelectedLeave(leave);
        setRejectionReason("");
        setRejectError("");
        setShowRejectForm(true);
    }

    function closeRejectForm() {
        if (actionLoading) {
            return;
        }

        setShowRejectForm(false);
        setRejectionReason("");
        setRejectError("");
    }

    async function handleReject(e) {
        e.preventDefault();

        const cleanedReason =
            rejectionReason.trim();

        if (!cleanedReason) {
            setRejectError(
                "Rejection reason is required"
            );
            return;
        }

        if (cleanedReason.length < 3) {
            setRejectError(
                "Rejection reason must contain at least 3 characters"
            );
            return;
        }

        if (cleanedReason.length > 500) {
            setRejectError(
                "Rejection reason cannot exceed 500 characters"
            );
            return;
        }

        try {
            setActionLoading(true);

            await api.patch(
                `${API_URL}/leaves/${selectedLeave._id}/reject`,
                {
                    rejectionReason: cleanedReason
                }
            );

            toast.success(
                "Leave request rejected successfully"
            );

            closeRejectForm();

            setShowDetails(false);
            setSelectedLeave(null);

            await fetchLeaveData();

        } catch (error) {
            console.error(
                "Reject Leave Error:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                "Failed to reject leave request"
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this leave request?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);

            await api.delete(
                `${API_URL}/leaves/${id}`
            );

            toast.success(
                "Leave request deleted successfully"
            );

            setShowDetails(false);
            setSelectedLeave(null);

            await fetchLeaveData();

        } catch (error) {
            console.error(
                "Delete Leave Error:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                "Failed to delete leave request"
            );
        } finally {
            setActionLoading(false);
        }
    }

    function openDetails(leave) {
        setSelectedLeave(leave);
        setShowDetails(true);
    }

    function closeDetails() {
        setShowDetails(false);
        setSelectedLeave(null);
    }

    function getStatusClass(status) {
        return `leave-status leave-status-${status.toLowerCase()}`;
    }

    function formatDate(date) {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString();
    }

    if (loading) {
        return (
            <Layout>
                <h1>Leave Management</h1>
                <p>Loading leave requests...</p>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="leave-management-page">

                {/* PAGE HEADER */}

                <div className="page-header">
                    <div>
                        <h1>Leave Management</h1>
                        <p>
                            Manage employee leave requests
                        </p>
                    </div>
                </div>

                {/* SUMMARY */}

                {summary && (
                    <div className="leave-summary-grid">

                        <div className="leave-summary-card">
                            <span>Total</span>
                            <strong>
                                {summary.total}
                            </strong>
                        </div>

                        <div className="leave-summary-card">
                            <span>Pending</span>
                            <strong>
                                {summary.pending}
                            </strong>
                        </div>

                        <div className="leave-summary-card">
                            <span>Approved</span>
                            <strong>
                                {summary.approved}
                            </strong>
                        </div>

                        <div className="leave-summary-card">
                            <span>Rejected</span>
                            <strong>
                                {summary.rejected}
                            </strong>
                        </div>

                        <div className="leave-summary-card">
                            <span>Cancelled</span>
                            <strong>
                                {summary.cancelled}
                            </strong>
                        </div>

                    </div>
                )}

                {/* FILTERS */}

                <div className="leave-filters">

                    <div className="form-field">
                        <label>Status</label>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                All Statuses
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Approved">
                                Approved
                            </option>

                            <option value="Rejected">
                                Rejected
                            </option>

                            <option value="Cancelled">
                                Cancelled
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Leave Type</label>

                        <select
                            value={leaveTypeFilter}
                            onChange={(e) =>
                                setLeaveTypeFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                All Leave Types
                            </option>

                            <option value="Casual Leave">
                                Casual Leave
                            </option>

                            <option value="Sick Leave">
                                Sick Leave
                            </option>

                            <option value="Earned Leave">
                                Earned Leave
                            </option>

                            <option value="Unpaid Leave">
                                Unpaid Leave
                            </option>

                            <option value="Optional Holiday">
                                Optional Holiday
                            </option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>

                </div>

                {/* TABLE */}

                <div className="leave-table-section">

                    <div className="section-header">
                        <h2>Leave Requests</h2>

                        <span>
                            {leaves.length} request
                            {leaves.length !== 1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                    {leaves.length === 0 ? (
                        <div className="empty-state">
                            <p>
                                No leave requests found.
                            </p>
                        </div>
                    ) : (
                        <div className="table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>
                                            Employee
                                        </th>

                                        <th>
                                            Leave Type
                                        </th>

                                        <th>
                                            From
                                        </th>

                                        <th>
                                            To
                                        </th>

                                        <th>
                                            Days
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {leaves.map(
                                        (leave) => (
                                            <tr
                                                key={
                                                    leave._id
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {
                                                            leave.employee
                                                                ?.name
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            leave.employee
                                                                ?.employeeId
                                                        }
                                                    </small>
                                                </td>

                                                <td>
                                                    {
                                                        leave.leaveType
                                                    }
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        leave.fromDate
                                                    )}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        leave.toDate
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        leave.days
                                                    }
                                                </td>

                                                <td>
                                                    <span
                                                        className={getStatusClass(
                                                            leave.status
                                                        )}
                                                    >
                                                        {
                                                            leave.status
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="leave-actions">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDetails(
                                                                    leave
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        {leave.status ===
                                                            "Pending" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            leave._id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    Approve
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openRejectForm(
                                                                            leave
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {leave.status !==
                                                            "Approved" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        leave._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        )}

                                                    </div>
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* DETAILS MODAL */}

                {showDetails &&
                    selectedLeave && (
                        <div className="modal-overlay">

                            <div className="modal">

                                <div className="modal-header">
                                    <h2>
                                        Leave Details
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={
                                            closeDetails
                                        }
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="modal-body">

                                    <div className="detail-row">
                                        <strong>
                                            Employee
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave
                                                    .employee
                                                    ?.name
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            Employee ID
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave
                                                    .employee
                                                    ?.employeeId
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            Department
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave
                                                    .employee
                                                    ?.department
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            Designation
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave
                                                    .employee
                                                    ?.designation
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            Leave Type
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave.leaveType
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            From Date
                                        </strong>

                                        <span>
                                            {formatDate(
                                                selectedLeave.fromDate
                                            )}
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            To Date
                                        </strong>

                                        <span>
                                            {formatDate(
                                                selectedLeave.toDate
                                            )}
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            Days
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave.days
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>
                                            Status
                                        </strong>

                                        <span
                                            className={getStatusClass(
                                                selectedLeave.status
                                            )}
                                        >
                                            {
                                                selectedLeave.status
                                            }
                                        </span>
                                    </div>

                                    <div className="detail-row detail-reason">
                                        <strong>
                                            Reason
                                        </strong>

                                        <span>
                                            {
                                                selectedLeave.reason
                                            }
                                        </span>
                                    </div>

                                    {selectedLeave.rejectionReason && (
                                        <div className="detail-row detail-reason">
                                            <strong>
                                                Rejection Reason
                                            </strong>

                                            <span>
                                                {
                                                    selectedLeave.rejectionReason
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {selectedLeave.approvedBy && (
                                        <div className="detail-row">
                                            <strong>
                                                Approved By
                                            </strong>

                                            <span>
                                                {
                                                    selectedLeave
                                                        .approvedBy
                                                        .name
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {selectedLeave.approvedAt && (
                                        <div className="detail-row">
                                            <strong>
                                                Approved At
                                            </strong>

                                            <span>
                                                {formatDate(
                                                    selectedLeave.approvedAt
                                                )}
                                            </span>
                                        </div>
                                    )}

                                </div>

                                <div className="modal-footer">

                                    {selectedLeave.status ===
                                        "Pending" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApprove(
                                                        selectedLeave._id
                                                    )
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >
                                                Approve
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openRejectForm(
                                                        selectedLeave
                                                    )
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        onClick={
                                            closeDetails
                                        }
                                    >
                                        Close
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                {/* REJECT MODAL */}

                {showRejectForm &&
                    selectedLeave && (
                        <div className="modal-overlay">

                            <div className="modal">

                                <div className="modal-header">
                                    <h2>
                                        Reject Leave Request
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={
                                            closeRejectForm
                                        }
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    onSubmit={
                                        handleReject
                                    }
                                >

                                    <div className="modal-body">

                                        <p>
                                            Rejecting leave
                                            request for{" "}
                                            <strong>
                                                {
                                                    selectedLeave
                                                        .employee
                                                        ?.name
                                                }
                                            </strong>
                                        </p>

                                        <div className="form-field">

                                            <label>
                                                Rejection Reason
                                            </label>

                                            <textarea
                                                rows="4"
                                                maxLength="500"
                                                value={
                                                    rejectionReason
                                                }
                                                className={
                                                    rejectError
                                                        ? "input-error"
                                                        : ""
                                                }
                                                onChange={(
                                                    e
                                                ) => {
                                                    setRejectionReason(
                                                        e
                                                            .target
                                                            .value
                                                    );

                                                    setRejectError(
                                                        ""
                                                    );
                                                }}
                                                placeholder="Enter reason for rejecting this leave"
                                            />

                                            {rejectError && (
                                                <span className="field-error">
                                                    {
                                                        rejectError
                                                    }
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                    <div className="modal-footer">

                                        <button
                                            type="button"
                                            onClick={
                                                closeRejectForm
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            {actionLoading
                                                ? "Rejecting..."
                                                : "Reject Leave"}
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>
                    )}

            </div>
        </Layout>
    );
}

export default LeaveManagement;
