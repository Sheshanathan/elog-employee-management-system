import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

function MyLeave() {
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: ""
    });

    const [errors, setErrors] = useState({});

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchMyLeaveData();
    }, []);

    async function fetchMyLeaveData() {
        try {
            setLoading(true);

            const [leavesResponse, balanceResponse] =
                await Promise.all([
                    api.get(`${API_URL}/leaves/my`),
                    api.get(`${API_URL}/leaves/balance/my`)
                ]);

            setLeaves(leavesResponse.data);
            setBalance(balanceResponse.data);

        } catch (error) {
            console.error("My Leave Error:", error);

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

        if (field === "fromDate") {
            if (!value) {
                error = "From date is required";
            }
        }

        if (field === "toDate") {
            if (!value) {
                error = "To date is required";
            } else if (
                formData.fromDate &&
                value < formData.fromDate
            ) {
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

        setErrors((previous) => ({
            ...previous,
            [field]: error
        }));

        return error;
    }

    function validateAllFields() {
        const leaveTypeError =
            validateField("leaveType", formData.leaveType);

        const fromDateError =
            validateField("fromDate", formData.fromDate);

        const toDateError =
            validateField("toDate", formData.toDate);

        const reasonError =
            validateField("reason", formData.reason);

        return !(
            leaveTypeError ||
            fromDateError ||
            toDateError ||
            reasonError
        );
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        validateField(name, value);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            setSubmitting(true);

            await api.post(`${API_URL}/leaves`, {
                leaveType: formData.leaveType,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                reason: formData.reason.trim()
            });

            toast.success(
                "Leave request submitted successfully"
            );

            setFormData({
                leaveType: "",
                fromDate: "",
                toDate: "",
                reason: ""
            });

            setErrors({});
            setShowForm(false);

            await fetchMyLeaveData();

        } catch (error) {
            console.error("Create Leave Error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to submit leave request"
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCancel(id) {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this leave request?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.patch(
                `${API_URL}/leaves/${id}/cancel`
            );

            toast.success(
                "Leave request cancelled successfully"
            );

            await fetchMyLeaveData();

        } catch (error) {
            console.error("Cancel Leave Error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to cancel leave request"
            );
        }
    }

    function calculateDays() {
        if (
            !formData.fromDate ||
            !formData.toDate
        ) {
            return 0;
        }

        const start = new Date(formData.fromDate);
        const end = new Date(formData.toDate);

        if (end < start) {
            return 0;
        }

        const difference =
            end.getTime() - start.getTime();

        return (
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1
        );
    }

    function getStatusClass(status) {
        return `leave-status leave-status-${status.toLowerCase()}`;
    }

    if (loading) {
        return (
            <Layout>
                <h1>My Leave</h1>
                <p>Loading leave information...</p>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="leave-page">

                <div className="page-header">
                    <div>
                        <h1>My Leave</h1>
                        <p>
                            Manage your leave requests and leave balance
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm
                            ? "Close"
                            : "Apply Leave"}
                    </button>
                </div>

                {/* LEAVE BALANCE */}

                {balance?.balance && (
                    <div className="leave-balance-section">

                        <h2>Leave Balance</h2>

                        <div className="leave-balance-grid">

                            {Object.entries(
                                balance.balance
                            ).map(
                                ([type, details]) => (
                                    <div
                                        className="leave-balance-card"
                                        key={type}
                                    >
                                        <h3>{type}</h3>

                                        <div>
                                            <strong>
                                                {details.remaining === null
                                                    ? "Unlimited"
                                                    : details.remaining}
                                            </strong>

                                            <span>
                                                Remaining
                                            </span>
                                        </div>

                                        <p>
                                            Used:{" "}
                                            {details.used}
                                        </p>

                                        <p>
                                            Total:{" "}
                                            {details.total === null
                                                ? "Unlimited"
                                                : details.total}
                                        </p>
                                    </div>
                                )
                            )}

                        </div>
                    </div>
                )}

                {/* APPLY LEAVE FORM */}

                {showForm && (
                    <div className="leave-form-container">

                        <h2>Apply for Leave</h2>

                        <form onSubmit={handleSubmit}>

                            <div className="form-field">
                                <label>
                                    Leave Type
                                </label>

                                <select
                                    name="leaveType"
                                    value={formData.leaveType}
                                    className={
                                        errors.leaveType
                                            ? "input-error"
                                            : ""
                                    }
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Select Leave Type
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

                                {errors.leaveType && (
                                    <span className="field-error">
                                        {errors.leaveType}
                                    </span>
                                )}
                            </div>

                            <div className="form-row">

                                <div className="form-field">
                                    <label>
                                        From Date
                                    </label>

                                    <input
                                        type="date"
                                        name="fromDate"
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        value={
                                            formData.fromDate
                                        }
                                        className={
                                            errors.fromDate
                                                ? "input-error"
                                                : ""
                                        }
                                        onChange={handleChange}
                                    />

                                    {errors.fromDate && (
                                        <span className="field-error">
                                            {errors.fromDate}
                                        </span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label>
                                        To Date
                                    </label>

                                    <input
                                        type="date"
                                        name="toDate"
                                        min={
                                            formData.fromDate ||
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        value={
                                            formData.toDate
                                        }
                                        className={
                                            errors.toDate
                                                ? "input-error"
                                                : ""
                                        }
                                        onChange={handleChange}
                                    />

                                    {errors.toDate && (
                                        <span className="field-error">
                                            {errors.toDate}
                                        </span>
                                    )}
                                </div>

                            </div>

                            {calculateDays() > 0 && (
                                <p>
                                    Leave Duration:{" "}
                                    <strong>
                                        {calculateDays()}{" "}
                                        {calculateDays() === 1
                                            ? "day"
                                            : "days"}
                                    </strong>
                                </p>
                            )}

                            <div className="form-field">
                                <label>
                                    Reason
                                </label>

                                <textarea
                                    name="reason"
                                    value={
                                        formData.reason
                                    }
                                    rows="4"
                                    maxLength="500"
                                    className={
                                        errors.reason
                                            ? "input-error"
                                            : ""
                                    }
                                    onChange={handleChange}
                                    placeholder="Enter reason for leave"
                                />

                                {errors.reason && (
                                    <span className="field-error">
                                        {errors.reason}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Submitting..."
                                    : "Submit Leave Request"}
                            </button>

                        </form>
                    </div>
                )}

                {/* MY LEAVE REQUESTS */}

                <div className="leave-requests-section">

                    <div className="section-header">
                        <h2>My Leave Requests</h2>
                    </div>

                    {leaves.length === 0 ? (
                        <div className="empty-state">
                            <p>
                                You have no leave requests.
                            </p>
                        </div>
                    ) : (
                        <div className="table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Leave Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Action</th>
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
                                                    {
                                                        leave.leaveType
                                                    }
                                                </td>

                                                <td>
                                                    {new Date(
                                                        leave.fromDate
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td>
                                                    {new Date(
                                                        leave.toDate
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td>
                                                    {
                                                        leave.days
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        leave.reason
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

                                                    {[
                                                        "Pending",
                                                        "Approved"
                                                    ].includes(
                                                        leave.status
                                                    ) && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCancel(
                                                                    leave._id
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}

                                                    {leave.status ===
                                                        "Rejected" &&
                                                        leave.rejectionReason && (
                                                            <small>
                                                                Reason:{" "}
                                                                {
                                                                    leave.rejectionReason
                                                                }
                                                            </small>
                                                        )}

                                                </td>
                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

            </div>
        </Layout>
    );
}

export default MyLeave;