import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import Layout from "../components/Layout";
import {
  Card,
  StatusBadge,
  LoadingSpinner,
  ConfirmationModal,
} from "../components/FormField";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import {
  formatAttendanceTime,
  formatAttendanceDate,
  formatAttendanceDateTime,
  formatWorkingHours,
  toTimeInputValue,
  MAX_TIME_EDITS,
  EDIT_WINDOW_MINUTES,
} from "../utils/attendance";
import "../styles/design-system.css";
const isToday = (date) => {
  if (!date) return false;

  const recordDate = new Date(date);
  const currentDate = new Date();

  return (
    recordDate.getFullYear() === currentDate.getFullYear() &&
    recordDate.getMonth() === currentDate.getMonth() &&
    recordDate.getDate() === currentDate.getDate()
  );
};
function EmployeeDashboard() {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
  });
  const [editTimes, setEditTimes] = useState({ checkIn: "", checkOut: "" });
  const [showEditForm, setShowEditForm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, attendanceRes] = await Promise.all([
        api.get("/employees/my/profile"),
        api.get("/attendance/my"),
      ]);
      setProfile(profileRes.data);
      setRecords(attendanceRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load your dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = records.find((record) => isToday(record.date));

  useEffect(() => {
    if (!today) {
      setEditTimes({ checkIn: "", checkOut: "" });
      return;
    }

    setEditTimes({
      checkIn: toTimeInputValue(today.checkIn),
      checkOut: toTimeInputValue(today.checkOut),
    });
  }, [today]);

  const monthlyRecords = records.filter(
    (record) => new Date(record.date).getMonth() === new Date().getMonth()
  );

  const counts = monthlyRecords.reduce(
    (acc, record) => ({
      ...acc,
      [record.status]: (acc[record.status] || 0) + 1,
    }),
    {}
  );

  const editsRemaining = today
    ? Math.max(0, MAX_TIME_EDITS - (today.timeEditCount || 0))
    : MAX_TIME_EDITS;

  const canEditTimes = Boolean(
    today &&
    !today.daySubmitted &&
    editsRemaining > 0 &&
    today.checkIn
  );

  const openConfirm = (type) => {
    setConfirmModal({ isOpen: true, type });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, type: null });
  };

  const performCheckIn = async () => {
    setActionLoading(true);
    try {
      const response = await api.post("/attendance/check-in", {});
      toast.success(response.data.message || "Check-in successful");
      closeConfirm();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const performCheckOut = async () => {
    setActionLoading(true);
    try {
      const response = await api.put("/attendance/check-out", {});
      toast.success(response.data.message || "Check-out successful");
      closeConfirm();
      await loadData();
      setConfirmModal({ isOpen: true, type: "submit-day" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitDay = async () => {
    setActionLoading(true);
    try {
      const response = await api.post("/attendance/my/submit-day", {});
      toast.success(response.data.message || "Attendance submitted for today");
      closeConfirm();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit attendance");
    } finally {
      setActionLoading(false);
    }
  };

  const saveEditedTimes = async () => {
    if (!today) {
      return;
    }

    setActionLoading(true);
    try {
      const payload = {};

      if (editTimes.checkIn) {
        payload.checkIn = editTimes.checkIn;
      }

      if (editTimes.checkOut) {
        payload.checkOut = editTimes.checkOut;
      }

      const response = await api.patch("/attendance/my/times", payload);
      toast.success(response.data.message || "Times updated successfully");
      setShowEditForm(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update times");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmModal.type === "check-in") {
      await performCheckIn();
      return;
    }

    if (confirmModal.type === "check-out") {
      await performCheckOut();
      return;
    }

    if (confirmModal.type === "submit-day") {
      await submitDay();
    }
  };

  const getConfirmContent = () => {
    const now = new Date();

    if (confirmModal.type === "check-in") {
      return {
        title: "Confirm Check-In",
        message: "Please confirm you want to check in for today.",
        warning: `Check-in time: ${formatAttendanceDateTime(now)}`,
        confirmText: "Confirm Check-In",
      };
    }

    if (confirmModal.type === "check-out") {
      return {
        title: "Confirm Check-Out",
        message: "Please confirm you want to check out for today.",
        warning: `Check-out time: ${formatAttendanceDateTime(now)}`,
        confirmText: "Confirm Check-Out",
      };
    }

    if (confirmModal.type === "submit-day") {
      return {
        title: "Submit Today's Attendance",
        message: "Review your attendance details before final submission.",
        warning: [
          `Date: ${formatAttendanceDate(today?.date)}`,
          `Check-In: ${formatAttendanceDateTime(today?.checkIn)}`,
          `Check-Out: ${formatAttendanceDateTime(today?.checkOut)}`,
          `Working Hours: ${formatWorkingHours(today?.workingHours)}`,
          `Time edits used: ${today?.timeEditCount || 0}/${MAX_TIME_EDITS}`,
        ].join("\n"),
        confirmText: "Submit Attendance",
      };
    }

    return {
      title: "Confirm",
      message: "",
      warning: "",
      confirmText: "Confirm",
    };
  };

  const confirmContent = getConfirmContent();

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
          <h1>
    Welcome,{" "}
    {profile?.employee?.name ||
        profile?.name ||
        "Employee"}
</h1>

<p>
    {profile?.employee?.employeeId ||
        profile?.employeeId}{" "}
    •{" "}
    {getDepartmentName(
        profile?.employee?.department ||
        profile?.department
    )}{" "}
    •{" "}
    {getDesignationName(
        profile?.employee?.designation ||
        profile?.designation
    )}
</p>
        </div>
      </div>

      <div className="grid-4">
        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">Today's Status</h4>
            <h2 className="dashboard-stat-value">
              {today ? <StatusBadge status={today.status} /> : <span className="text-muted">Not Checked In</span>}
            </h2>
            {today?.daySubmitted && (
              <p className="attendance-submitted-note">Submitted for today</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">Check-In Time</h4>
            <h2 className="dashboard-stat-value dashboard-stat-primary">
              {formatAttendanceTime(today?.checkIn)}
            </h2>
          </div>
        </Card>

        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">Check-Out Time</h4>
            <h2 className="dashboard-stat-value dashboard-stat-primary">
              {formatAttendanceTime(today?.checkOut)}
            </h2>
          </div>
        </Card>

        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">Working Hours</h4>
            <h2 className="dashboard-stat-value dashboard-stat-success">
              {formatWorkingHours(today?.workingHours)}
            </h2>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: "var(--spacing-8)" }}>
        <div className="card-body">
          <h3 style={{ marginTop: 0 }}>Attendance Actions</h3>
          <div className="flex gap-4 attendance-action-row">
            {!today?.checkIn ? (
              <button
                type="button"
                className={`btn btn-primary ${actionLoading ? "is-loading" : ""}`}
                onClick={() => openConfirm("check-in")}
                disabled={actionLoading}
              >
                Check In
              </button>
            ) : !today?.checkOut ? (
              <button
                type="button"
                className={`btn btn-primary ${actionLoading ? "is-loading" : ""}`}
                onClick={() => openConfirm("check-out")}
                disabled={actionLoading}
              >
                Check Out
              </button>
            ) : !today?.daySubmitted ? (
              <button
                type="button"
                className={`btn btn-primary ${actionLoading ? "is-loading" : ""}`}
                onClick={() => openConfirm("submit-day")}
                disabled={actionLoading}
              >
                Submit Today's Attendance
              </button>
            ) : (
              <div className="alert alert-success">
                Attendance completed and submitted for today
              </div>
            )}

            {canEditTimes && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditForm((prev) => !prev)}
                disabled={actionLoading}
              >
                {showEditForm ? "Hide Time Edit" : "Adjust Times"}
              </button>
            )}
          </div>

          {canEditTimes && (
            <p className="attendance-edit-note">
              You can adjust times up to {editsRemaining} more time(s). Each change must stay within {EDIT_WINDOW_MINUTES} minutes of the original recorded time.
            </p>
          )}

          {showEditForm && canEditTimes && (
            <div className="attendance-edit-form">
              <div className="attendance-edit-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-check-in">Check-In Time</label>
                  <input
                    id="edit-check-in"
                    type="time"
                    value={editTimes.checkIn}
                    onChange={(event) =>
                      setEditTimes((prev) => ({ ...prev, checkIn: event.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-check-out">Check-Out Time</label>
                  <input
                    id="edit-check-out"
                    type="time"
                    value={editTimes.checkOut}
                    disabled={!today?.checkOut}
                    onChange={(event) =>
                      setEditTimes((prev) => ({ ...prev, checkOut: event.target.value }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-primary ${actionLoading ? "is-loading" : ""}`}
                onClick={saveEditedTimes}
                disabled={actionLoading}
              >
                Save Time Changes
              </button>
            </div>
          )}
        </div>
      </Card>

      <h2 style={{ marginTop: "var(--spacing-12)" }}>This Month's Summary</h2>
      <div className="grid-3">
        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">Present</h4>
            <h2 className="dashboard-stat-value dashboard-stat-success">{counts.Present || 0}</h2>
          </div>
        </Card>
        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">Absent</h4>
            <h2 className="dashboard-stat-value dashboard-stat-error">{counts.Absent || 0}</h2>
          </div>
        </Card>
        <Card>
          <div className="card-body">
            <h4 className="dashboard-stat-label">On Leave</h4>
            <h2 className="dashboard-stat-value dashboard-stat-info">{counts.Leave || 0}</h2>
          </div>
        </Card>
      </div>

      <h2 style={{ marginTop: "var(--spacing-12)" }}>Recent Attendance</h2>
      <Card>
        <div className="table-responsive table-responsive-fit">
          <table className="app-data-table attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Hours</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-message">
                    No attendance records yet
                  </td>
                </tr>
              ) : (
                records.slice(0, 10).map((record) => (
                  <tr key={record._id}>
                    <td><strong>{formatAttendanceDate(record.date)}</strong></td>
                    <td className="cell-badge"><StatusBadge status={record.status} /></td>
                    <td>{formatAttendanceTime(record.checkIn)}</td>
                    <td>{formatAttendanceTime(record.checkOut)}</td>
                    <td>{formatWorkingHours(record.workingHours)}</td>
                    <td>{record.daySubmitted ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmContent.title}
        message={confirmContent.message}
        warning={confirmContent.warning}
        confirmText={confirmContent.confirmText}
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
        isLoading={actionLoading}
        isDangerous={false}
      />
    </Layout>
  );
}

export default EmployeeDashboard;
