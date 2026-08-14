import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

function AddAttendance() {
    const [employees, setEmployees] = useState([]);

    const [employee, setEmployee] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState("");
    const [remarks, setRemarks] = useState("");

    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        async function fetchEmployees() {
            try {
                const response = await api.get(
                    `${import.meta.env.VITE_API_URL}/employees`
                );

                setEmployees(response.data);
            } catch {
    toast.error(
        "Failed to load employees"
    );
}
        }

        fetchEmployees();
    }, []);

    function validateField(field, value) {
        let error = "";

        if (field === "employee" && !value) {
            error = "Employee is required";
        }

        if (field === "date") {
            if (!value) {
                error = "Attendance date is required";
            } else {
                const today =
                    new Date()
                        .toISOString()
                        .split("T")[0];

                if (value > today) {
                    error =
                        "Attendance date cannot be in the future";
                }
            }
        }

        if (field === "status" && !value) {
            error = "Attendance status is required";
        }

        if (field === "remarks" && value.length > 200) {
            error =
                "Remarks cannot exceed 200 characters";
        }

        setErrors((previous) => ({
            ...previous,
            [field]: error
        }));

        return error === "";
    }

    function validateAllFields() {
        const employeeError =
            validateField("employee", employee);

        const dateError =
            validateField("date", date);

        const statusError =
            validateField("status", status);

        const remarksError =
            validateField("remarks", remarks);

        return (
            employeeError &&
            dateError &&
            statusError &&
            remarksError
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            await api.post(
                `${import.meta.env.VITE_API_URL}/attendance`,
                {
                    employee,
                    date,
                    status,
                    remarks
                }
            );

            toast.success(
                "Attendance Created Successfully"
            );

            navigate("/attendance");

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to create attendance"
            );
        }
    }

    return (
        <Layout>

            <h1>Add Attendance</h1>

            <form onSubmit={handleSubmit}>

                <div className="form-field">

                    <label>Employee</label>

                    <select
                        value={employee}
                        className={
                            errors.employee
                                ? "input-error"
                                : ""
                        }
                        onChange={(e) => {
                            const value = e.target.value;

                            setEmployee(value);

                            validateField(
                                "employee",
                                value
                            );
                        }}
                    >
                        <option value="">
                            Select Employee
                        </option>

                        {employees.map((item) => (
                            <option
                                key={item._id}
                                value={item._id}
                            >
                                {item.employeeId} -{" "}
                                {item.name}
                            </option>
                        ))}
                    </select>

                    {errors.employee && (
                        <span className="field-error">
                            {errors.employee}
                        </span>
                    )}

                </div>


                <div className="form-field">

                    <label>Attendance Date</label>

                    <input
                        type="date"
                        value={date}
                        max={
                            new Date()
                                .toISOString()
                                .split("T")[0]
                        }
                        className={
                            errors.date
                                ? "input-error"
                                : ""
                        }
                        onChange={(e) => {
                            const value = e.target.value;

                            setDate(value);

                            validateField(
                                "date",
                                value
                            );
                        }}
                    />

                    {errors.date && (
                        <span className="field-error">
                            {errors.date}
                        </span>
                    )}

                </div>


                <div className="form-field">

                    <label>Status</label>

                    <select
                        value={status}
                        className={
                            errors.status
                                ? "input-error"
                                : ""
                        }
                        onChange={(e) => {
                            const value = e.target.value;

                            setStatus(value);

                            validateField(
                                "status",
                                value
                            );
                        }}
                    >
                        <option value="">
                            Select Status
                        </option>

                        <option value="Present">
                            Present
                        </option>

                        <option value="Absent">
                            Absent
                        </option>

                        <option value="Leave">
                            Leave
                        </option>
                    </select>

                    {errors.status && (
                        <span className="field-error">
                            {errors.status}
                        </span>
                    )}

                </div>


                <div className="form-field">

                    <label>Remarks</label>

                    <input
                        type="text"
                        placeholder="Enter remarks"
                        value={remarks}
                        className={
                            errors.remarks
                                ? "input-error"
                                : ""
                        }
                        onChange={(e) => {
                            const value = e.target.value;

                            setRemarks(value);

                            validateField(
                                "remarks",
                                value
                            );
                        }}
                    />

                    {errors.remarks && (
                        <span className="field-error">
                            {errors.remarks}
                        </span>
                    )}

                </div>


                <button type="submit">
                    Add Attendance
                </button>

            </form>

        </Layout>
    );
}

export default AddAttendance;