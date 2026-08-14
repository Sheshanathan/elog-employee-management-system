import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import { toTimeInputValue } from "../utils/attendance";
import "../styles/design-system.css";

function EditAttendance() {
    const [employees, setEmployees] = useState([]);
    const [employee, setEmployee] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState("");
    const [remarks, setRemarks] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();
    const requestStarted = useRef(false);

    useEffect(() => {
        if (requestStarted.current) return;
        requestStarted.current = true;

        async function loadData() {
            try {
                const [employeeResponse, attendanceResponse] = await Promise.all([
                    api.get("/employees"),
                    api.get(`/attendance/${id}`),
                ]);

                setEmployees(employeeResponse.data || []);
                const data = attendanceResponse.data;

                setEmployee(data.employee?._id || data.employee || "");
                setDate(data.date ? data.date.split("T")[0] : "");
                setStatus(data.status || "");
                setRemarks(data.remarks || "");
                setCheckIn(toTimeInputValue(data.checkIn));
                setCheckOut(toTimeInputValue(data.checkOut));
            } catch (error) {
                toast.error(error.response?.data?.message || "Attendance not found");
                navigate("/attendance", { replace: true });
            }
        }

        loadData();
    }, [id, navigate]);

    function validateField(field, value) {
        let error = "";

        if (field === "employee" && !value) {
            error = "Employee is required";
        }

        if (field === "date") {
            if (!value) {
                error = "Attendance date is required";
            } else {
                const today = new Date().toISOString().split("T")[0];
                if (value > today) {
                    error = "Attendance date cannot be in the future";
                }
            }
        }

        if (field === "status" && !value) {
            error = "Attendance status is required";
        }

        if (field === "remarks" && value.length > 200) {
            error = "Remarks cannot exceed 200 characters";
        }

        setErrors((previous) => ({
            ...previous,
            [field]: error,
        }));

        return error === "";
    }

    function validateAllFields() {
        return (
            validateField("employee", employee) &&
            validateField("date", date) &&
            validateField("status", status) &&
            validateField("remarks", remarks)
        );
    }

    function buildDateTime(dateValue, timeValue) {
        if (!dateValue || !timeValue) {
            return null;
        }

        return new Date(`${dateValue}T${timeValue}:00`).toISOString();
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        setSubmitting(true);

        try {
            await api.put(`/attendance/${id}`, {
                employee,
                date,
                status,
                remarks,
                checkIn: buildDateTime(date, checkIn),
                checkOut: buildDateTime(date, checkOut),
            });

            toast.success("Attendance updated successfully");
            navigate("/attendance");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update attendance");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>Edit Attendance</h1>
                    <p>Update attendance status, times, and remarks</p>
                </div>
            </div>

            <div className="card form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label required" htmlFor="attendance-employee">Employee</label>
                        <select
                            id="attendance-employee"
                            value={employee}
                            className={errors.employee ? "is-invalid" : ""}
                            onChange={(event) => {
                                const value = event.target.value;
                                setEmployee(value);
                                validateField("employee", value);
                            }}
                        >
                            <option value="">Select Employee</option>
                            {employees.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.employeeId} - {item.name}
                                </option>
                            ))}
                        </select>
                        {errors.employee && <div className="form-error">{errors.employee}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="attendance-date">Attendance Date</label>
                        <input
                            id="attendance-date"
                            type="date"
                            value={date}
                            max={new Date().toISOString().split("T")[0]}
                            className={errors.date ? "is-invalid" : ""}
                            onChange={(event) => {
                                const value = event.target.value;
                                setDate(value);
                                validateField("date", value);
                            }}
                        />
                        {errors.date && <div className="form-error">{errors.date}</div>}
                    </div>

                    <div className="attendance-edit-grid">
                        <div className="form-group">
                            <label className="form-label" htmlFor="attendance-check-in">Check-In Time</label>
                            <input
                                id="attendance-check-in"
                                type="time"
                                value={checkIn}
                                onChange={(event) => setCheckIn(event.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="attendance-check-out">Check-Out Time</label>
                            <input
                                id="attendance-check-out"
                                type="time"
                                value={checkOut}
                                onChange={(event) => setCheckOut(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="attendance-status">Status</label>
                        <select
                            id="attendance-status"
                            value={status}
                            className={errors.status ? "is-invalid" : ""}
                            onChange={(event) => {
                                const value = event.target.value;
                                setStatus(value);
                                validateField("status", value);
                            }}
                        >
                            <option value="">Select Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                        </select>
                        {errors.status && <div className="form-error">{errors.status}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="attendance-remarks">Remarks</label>
                        <input
                            id="attendance-remarks"
                            type="text"
                            placeholder="Enter remarks"
                            value={remarks}
                            className={errors.remarks ? "is-invalid" : ""}
                            onChange={(event) => {
                                const value = event.target.value;
                                setRemarks(value);
                                validateField("remarks", value);
                            }}
                        />
                        {errors.remarks && <div className="form-error">{errors.remarks}</div>}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate("/attendance")}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-primary ${submitting ? "is-loading" : ""}`}
                            disabled={submitting}
                        >
                            Update Attendance
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default EditAttendance;