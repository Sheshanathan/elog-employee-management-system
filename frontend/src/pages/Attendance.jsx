import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { matchesSearch } from "../utils/search";
import {
    ConfirmationModal,
    LoadingSpinner,
    ResultsSummary,
    RowActionsMenu,
    StatusBadge,
} from "../components/FormField";
import {
    formatAttendanceDate,
    formatAttendanceDateTime,
    formatAttendanceTime,
    formatWorkingHours,
} from "../utils/attendance";
import "../styles/design-system.css";
import { downloadCSV } from "../utils/csv";
function Attendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        recordId: null,
        label: "",
    });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const handleExport = () => {
    downloadCSV("attendance", filteredAttendance, [
        { label: "Employee", format: (r) => r.employee?.name || "—" },
        { label: "Employee ID", format: (r) => r.employee?.employeeId || "—" },
        { label: "Date", format: (r) => formatAttendanceDate(r.date) },
        { key: "status", label: "Status" },
        { key: "workingHours", label: "Hours" },
        { key: "remarks", label: "Remarks" },
    ]);
};

    const attendancePerPage = 10;
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const isAdmin = role === "Admin";

    useEffect(() => {
        async function fetchAttendance() {
            setLoading(true);

            try {
                const response = await api.get(
                    isAdmin ? "/attendance" : "/attendance/my"
                );

                setAttendance(response.data || []);
            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    "Failed to load attendance"
                );
            } finally {
                setLoading(false);
            }
        }

        fetchAttendance();
    }, [isAdmin]);

    const handleDeleteClick = (record) => {
        setDeleteConfirm({
            isOpen: true,
            recordId: record._id,
            label: `${record.employee?.name || "Employee"} • ${formatAttendanceDate(record.date)}`,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.recordId) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete(`/attendance/${deleteConfirm.recordId}`);
            toast.success("Attendance deleted successfully");
            setAttendance((previous) =>
                previous.filter((record) => record._id !== deleteConfirm.recordId)
            );
            setDeleteConfirm({ isOpen: false, recordId: null, label: "" });
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to delete attendance"
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredAttendance = (attendance || []).filter((record) => {
        if (!isAdmin) {
            return true;
        }

        const matchesSearchQuery = matchesSearch(
            search,
            record.employee?.name,
            record.employee?.employeeId
        );

        const matchesStatus =
            statusFilter === "All" ||
            record.status === statusFilter;

        return matchesSearchQuery && matchesStatus;
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredAttendance.length / attendancePerPage)
    );
    const safePage = Math.min(currentPage, totalPages);
    const indexOfLastRecord = safePage * attendancePerPage;
    const indexOfFirstRecord = indexOfLastRecord - attendancePerPage;
    const currentAttendance = filteredAttendance.slice(
        indexOfFirstRecord,
        indexOfLastRecord
    );

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
        <h1>{isAdmin ? "Attendance" : "My Attendance"}</h1>
        <p>{isAdmin ? "Detailed attendance records for all employees" : "View your attendance history"}</p>
    </div>
    <div className="page-actions">
        <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
        </button>
        {isAdmin && (
            <button className="btn btn-primary" onClick={() => navigate("/add-attendance")}>
                Add Attendance
            </button>
        )}
    </div>
</div>

            {isAdmin && (
    <div className="filters-row filters-row--plain">
        <div className="filter-field">
            <label className="form-label">Search</label>
            <input
                type="text"
                className="search-box-sm"
                placeholder="Employee name or ID..."
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
                <option value="All">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
            </select>
        </div>
    </div>
)}
            <ResultsSummary
                shown={currentAttendance.length}
                total={filteredAttendance.length}
                label="records"
            />

            {filteredAttendance.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "var(--spacing-16)" }}>
                    <p className="text-muted" style={{ marginBottom: 0 }}>
                        No attendance records found
                    </p>
                </div>
            ) : (
                <div className="card app-table-card">
                    <div className="table-responsive table-responsive-fit">
                        <table className={`app-data-table attendance-table${isAdmin ? " attendance-table--admin" : ""}`}>
                            <thead>
                                <tr>
                                    {isAdmin && <th className="col-id">Employee ID</th>}
                                    {isAdmin && <th className="col-name">Name</th>}
                                    <th className="col-date">Date</th>
                                    <th className="col-checkin">Check-In</th>
                                    <th className="col-checkout">Check-Out</th>
                                    <th className="col-hours">Hours</th>
                                    <th className="col-status col-badge">Status</th>
                                    {isAdmin && <th className="col-edits">Edits</th>}
                                    {isAdmin && <th className="col-submitted">Submitted</th>}
                                    <th className="col-remarks">Remarks</th>
                                    {isAdmin && <th className="col-actions">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {currentAttendance.map((record) => (
                                    <tr key={record._id}>
                                        {isAdmin && (
                                            <td className="col-id cell-nowrap">
                                                {record.employee?.employeeId || "N/A"}
                                            </td>
                                        )}
                                        {isAdmin && (
                                            <td className="col-name cell-ellipsis cell-text" title={record.employee?.name || "N/A"}>
                                                {record.employee?.name || "N/A"}
                                            </td>
                                        )}
                                        <td className="col-date cell-nowrap">
                                            {formatAttendanceDate(record.date)}
                                        </td>
                                        <td className="col-checkin cell-nowrap" title={formatAttendanceDateTime(record.checkIn)}>
                                            {formatAttendanceTime(record.checkIn)}
                                        </td>
                                        <td className="col-checkout cell-nowrap" title={formatAttendanceDateTime(record.checkOut)}>
                                            {formatAttendanceTime(record.checkOut)}
                                        </td>
                                        <td className="col-hours cell-nowrap">
                                            {formatWorkingHours(record.workingHours)}
                                        </td>
                                        <td className="col-status cell-badge">
                                            <StatusBadge status={record.status} />
                                        </td>
                                        {isAdmin && (
                                            <td className="col-edits cell-nowrap">
                                                {record.timeEditCount || 0}/3
                                            </td>
                                        )}
                                        {isAdmin && (
                                            <td className="col-submitted cell-nowrap">
                                                {record.daySubmitted ? "Yes" : "No"}
                                            </td>
                                        )}
                                        <td className="col-remarks cell-ellipsis" title={record.remarks || "—"}>
                                            {record.remarks || "—"}
                                        </td>
                                        {isAdmin && (
                                            <td className="col-actions cell-actions">
                                                <RowActionsMenu
                                                    ariaLabel={`Actions for ${record.employee?.name || "attendance record"}`}
                                                    items={[
                                                        {
                                                            key: "edit",
                                                            label: "Edit",
                                                            onClick: () => navigate(`/edit-attendance/${record._id}`),
                                                        },
                                                        {
                                                            key: "delete",
                                                            label: "Delete",
                                                            danger: true,
                                                            onClick: () => handleDeleteClick(record),
                                                        },
                                                    ]}
                                                />
                                            </td>
                                        )}
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
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Attendance Record"
                message={`Are you sure you want to delete this attendance record?`}
                warning={deleteConfirm.label}
                confirmText="Delete Record"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, recordId: null, label: "" })}
                isLoading={deleteLoading}
                isDangerous={true}
            />
        </Layout>
    );
}

export default Attendance;