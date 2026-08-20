import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import {
    Card,
    ConfirmationModal,
    LoadingSpinner,
    ResultsSummary,
    StatusBadge,
} from "../components/FormField";
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

function calculateDays(fromDate, toDate) {
    if (!fromDate || !toDate) return 0;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (end < start) return 0;

    const difference = end.getTime() - start.getTime();
    return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
}

function MyLeave() {
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState({
        isOpen: false,
        leaveId: null,
        label: "",
    });
    const [cancelLoading, setCancelLoading] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchMyLeaveData();
    }, []);

    async function fetchMyLeaveData() {
        try {
            setLoading(true);

            const [leavesResponse, balanceResponse] = await Promise.all([
                api.get("/leaves/my"),
                api.get("/leaves/balance/my"),
            ]);

            setLeaves(leavesResponse.data || []);
            setBalance(balanceResponse.data);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load leave information"
            );
        } finally {
            setLoading(false);
        }
    }

    function validateField(field, value) {
        let error = "";

        if (field === "leaveType" && !value) {
            error = "Leave type is required";
        }

        if (field === "fromDate" && !value) {
            error = "From date is required";
        }

        if (field === "toDate") {
            if (!value) {
                error = "To date is required";
            } else if (formData.fromDate && value < formData.fromDate) {
                error = "To date cannot be before from date";
            }
        }

        if (field === "reason") {
            const trimmed = value.trim();
            if (!trimmed) {
                error = "Reason is required";
            } else if (trimmed.length < 3) {
                error = "Reason must contain at least 3 characters";
            } else if (trimmed.length > 500) {
                error = "Reason cannot exceed 500 characters";
            }
        }

        setErrors((prev) => ({ ...prev, [field]: error }));
        return error;
    }

    function validateAllFields() {
        const leaveTypeError = validateField("leaveType", formData.leaveType);
        const fromDateError = validateField("fromDate", formData.fromDate);
        const toDateError = validateField("toDate", formData.toDate);
        const reasonError = validateField("reason", formData.reason);

        return !(leaveTypeError || fromDateError || toDateError || reasonError);
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        validateField(name, value);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            setSubmitting(true);

            await api.post("/leaves", {
                leaveType: formData.leaveType,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                reason: formData.reason.trim(),
            });

            toast.success("Leave request submitted successfully");

            setFormData({
                leaveType: "",
                fromDate: "",
                toDate: "",
                reason: "",
            });
            setErrors({});
            setShowForm(false);

            await fetchMyLeaveData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error("Please fix the validation errors");
            } else {
                toast.error(
                    error.response?.data?.message ||
                    "Failed to submit leave request"
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    function handleCancelClick(leave) {
        setCancelConfirm({
            isOpen: true,
            leaveId: leave._id,
            label: `${leave.leaveType} • ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)}`,
        });
    }

    async function handleCancelConfirm() {
        if (!cancelConfirm.leaveId) {
            return;
        }

        try {
            setCancelLoading(true);
            await api.patch(`/leaves/${cancelConfirm.leaveId}/cancel`);
            toast.success("Leave request cancelled successfully");
            setCancelConfirm({ isOpen: false, leaveId: null, label: "" });
            await fetchMyLeaveData();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to cancel leave request"
            );
        } finally {
            setCancelLoading(false);
        }
    }

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    const today = new Date().toISOString().split("T")[0];
    const duration = calculateDays(formData.fromDate, formData.toDate);

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>My Leave</h1>
                    <p>Manage your leave requests and leave balance</p>
                </div>
                <div className="page-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowForm((prev) => !prev)}
                    >
                        {showForm ? "Close Form" : "Apply Leave"}
                    </button>
                </div>
            </div>

            {balance?.balance && (
                <div className="grid-4" style={{ marginBottom: "var(--spacing-6)" }}>
                    {Object.entries(balance.balance).map(([type, details]) => (
                        <Card key={type}>
                            <div className="card-body">
                                <h4>{type}</h4>
                                <h2 className="dashboard-stat-value dashboard-stat-primary">
                                    {details.remaining === null ? "Unlimited" : details.remaining}
                                </h2>
                                <small>Remaining</small>
                                <p className="text-muted" style={{ marginTop: "var(--spacing-2)", marginBottom: 0 }}>
                                    Used: {details.used} / {details.total === null ? "Unlimited" : details.total}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showForm && (
                <Card style={{ marginBottom: "var(--spacing-6)" }}>
                    <div className="card-body">
                        <h2 style={{ marginBottom: "var(--spacing-4)" }}>Apply for Leave</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row form-row--full">
                                <div className="form-field">
                                    <label className="form-label" htmlFor="leaveType">Leave Type</label>
                                    <select
                                        id="leaveType"
                                        name="leaveType"
                                        className={errors.leaveType ? "is-invalid" : undefined}
                                        value={formData.leaveType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Leave Type</option>
                                        {LEAVE_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    {errors.leaveType && (
                                        <span className="form-error">{errors.leaveType}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label className="form-label" htmlFor="fromDate">From Date</label>
                                    <input
                                        id="fromDate"
                                        type="date"
                                        name="fromDate"
                                        className={errors.fromDate ? "is-invalid" : undefined}
                                        min={today}
                                        value={formData.fromDate}
                                        onChange={handleChange}
                                    />
                                    {errors.fromDate && (
                                        <span className="form-error">{errors.fromDate}</span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label className="form-label" htmlFor="toDate">To Date</label>
                                    <input
                                        id="toDate"
                                        type="date"
                                        name="toDate"
                                        className={errors.toDate ? "is-invalid" : undefined}
                                        min={formData.fromDate || today}
                                        value={formData.toDate}
                                        onChange={handleChange}
                                    />
                                    {errors.toDate && (
                                        <span className="form-error">{errors.toDate}</span>
                                    )}
                                </div>
                            </div>

                            {duration > 0 && (
                                <p className="text-muted" style={{ marginBottom: "var(--spacing-4)" }}>
                                    Leave Duration: <strong>{duration} {duration === 1 ? "day" : "days"}</strong>
                                </p>
                            )}

                            <div className="form-row form-row--full">
                                <div className="form-field">
                                    <label className="form-label" htmlFor="reason">Reason</label>
                                    <textarea
                                        id="reason"
                                        name="reason"
                                        className={errors.reason ? "is-invalid" : undefined}
                                        rows="4"
                                        maxLength="500"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        placeholder="Enter reason for leave"
                                    />
                                    {errors.reason && (
                                        <span className="form-error">{errors.reason}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className={`btn btn-primary${submitting ? " is-loading" : ""}`}
                                    disabled={submitting}
                                >
                                    {submitting ? "Submitting..." : "Submit Leave Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </Card>
            )}

            <ResultsSummary
                shown={leaves.length}
                total={leaves.length}
                label="requests"
            />

            {leaves.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "var(--spacing-16)" }}>
                    <p className="text-muted" style={{ marginBottom: 0 }}>
                        You have no leave requests.
                    </p>
                </Card>
            ) : (
                <Card className="app-table-card">
                    <div className="table-responsive table-responsive-fit">
                        <table className="app-data-table">
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Applied</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave._id}>
                                        <td className="cell-nowrap">{leave.leaveType}</td>
                                        <td className="cell-nowrap">{formatDate(leave.fromDate)}</td>
                                        <td className="cell-nowrap">{formatDate(leave.toDate)}</td>
                                        <td className="cell-nowrap">{leave.days}</td>
                                        <td className="cell-ellipsis" title={leave.reason}>{leave.reason}</td>
                                        <td className="cell-nowrap">{formatDate(leave.createdAt)}</td>
                                        <td className="cell-badge">
                                            <StatusBadge status={leave.status} />
                                        </td>
                                        <td className="cell-actions">
                                            {leave.status === "Pending" && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleCancelClick(leave)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {leave.status === "Rejected" && leave.rejectionReason && (
                                                <span className="text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
                                                    {leave.rejectionReason}
                                                </span>
                                            )}
                                            {leave.status === "Approved" && leave.adminRemark && (
                                                <span className="text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
                                                    {leave.adminRemark}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <ConfirmationModal
                isOpen={cancelConfirm.isOpen}
                title="Cancel Leave Request"
                message="Are you sure you want to cancel this leave request?"
                warning={cancelConfirm.label}
                confirmText="Cancel Leave"
                cancelText="Keep Request"
                onConfirm={handleCancelConfirm}
                onCancel={() => setCancelConfirm({ isOpen: false, leaveId: null, label: "" })}
                isLoading={cancelLoading}
                isDangerous={true}
            />
        </Layout>
    );
}

export default MyLeave;
