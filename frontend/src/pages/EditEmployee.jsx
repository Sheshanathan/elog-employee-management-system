import { useState, useEffect, useRef } from "react";
import {
    useNavigate,
    useParams,
    useSearchParams
} from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import {
    FormField,
    LoadingSpinner,
    ErrorState
} from "../components/FormField";
import { toast } from "react-toastify";
import {
    buildDepartmentOptions,
    getDepartmentId
} from "../utils/department";
import {
    buildDesignationOptions,
    getDesignationId
} from "../utils/designation";
import "../styles/design-system.css";

function EditEmployee() {
    const [formData, setFormData] =
        useState({
            name: "",
            email: "",
            phone: "",
            workLocation: "",
            department: "",
            designation: "",
            joiningDate: "",
            employmentType:
                "Full-time",
            salary: "",
            status: "Active"
        });

    const [departments, setDepartments] =
        useState([]);

    const [designations, setDesignations] =
        useState([]);

    const [optionsLoading, setOptionsLoading] =
        useState(true);

    const [optionsError, setOptionsError] =
        useState(false);

    const [employeeLoading, setEmployeeLoading] =
        useState(true);

    const [errors, setErrors] =
        useState({});

    const [submitting, setSubmitting] =
        useState(false);

    const { id } = useParams();

    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    /*
     * Preserve the page from which the
     * employee was opened.
     *
     * Example:
     * /edit-employee/123?page=2
     *
     * After update:
     * /employees?page=2
     */
    const returnPage =
        Number(searchParams.get("page")) ||
        1;

    const requestStarted =
        useRef(false);

    useEffect(() => {
        if (requestStarted.current) {
            return;
        }

        requestStarted.current = true;

        async function loadData() {
            setEmployeeLoading(true);
            setOptionsLoading(true);
            setOptionsError(false);

            try {
                const [
                    employeeResponse,
                    departmentsResponse,
                    designationsResponse
                ] = await Promise.all([
                    api.get(
                        `/employees/${id}`
                    ),
                    api.get(
                        "/departments"
                    ),
                    api.get(
                        "/designations"
                    )
                ]);

                const employee =
                    employeeResponse.data;

                const departmentList =
                    departmentsResponse.data ||
                    [];

                const designationList =
                    designationsResponse.data ||
                    [];

                setDepartments(
                    departmentList
                );

                setDesignations(
                    designationList
                );

                setFormData({
                    name:
                        employee.name ||
                        "",
                    email:
                        employee.email ||
                        "",
                    phone:
                        employee.phone ||
                        "",
                    workLocation:
                        employee.workLocation ||
                        "",
                    department:
                        getDepartmentId(
                            employee.department
                        ),
                    designation:
                        getDesignationId(
                            employee.designation
                        ),
                    joiningDate:
                        employee.joiningDate
                            ? employee.joiningDate.split(
                                "T"
                            )[0]
                            : "",
                    employmentType:
                        employee.employmentType ||
                        "Full-time",
                    salary:
                        employee.salary ??
                        "",
                    status:
                        employee.status ||
                        "Active"
                });
            } catch (error) {
                if (
                    error.config?.url?.includes(
                        "/employees/"
                    )
                ) {
                    toast.error(
                        error.response
                            ?.data?.message ||
                        "Employee not found."
                    );

                    navigate(
                        `/employees?page=${returnPage}`,
                        {
                            replace: true
                        }
                    );

                    return;
                }

                setOptionsError(true);

                toast.error(
                    error.response
                        ?.data?.message ||
                    "Failed to load required data"
                );
            } finally {
                setEmployeeLoading(
                    false
                );

                setOptionsLoading(
                    false
                );
            }
        }

        loadData();
    }, [
        id,
        navigate,
        returnPage
    ]);

    const departmentOptions =
        buildDepartmentOptions(
            departments,
            {
                includeInactiveId:
                    formData.department
            }
        );

    const designationOptions =
        buildDesignationOptions(
            designations,
            {
                includeInactiveId:
                    formData.designation
            }
        );

    const validateField = (
        field,
        value
    ) => {
        let error = "";

        if (field === "name") {
            if (!value.trim()) {
                error =
                    "Name is required";
            } else if (
                value.trim().length < 2
            ) {
                error =
                    "Name must contain at least 2 characters";
            } else if (
                !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                    value.trim()
                )
            ) {
                error =
                    "Name should contain only letters and spaces";
            }
        }

        if (
            field === "email" &&
            value
        ) {
            if (
                !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
                    value.trim()
                )
            ) {
                error =
                    "Enter a valid email address";
            }
        }

        if (
            field === "phone" &&
            value
        ) {
            if (
                !/^[0-9+()\-\s]{7,20}$/.test(
                    value.trim()
                )
            ) {
                error =
                    "Enter a valid phone number";
            }
        }

        if (field === "department") {
            if (!value) {
                error =
                    "Department is required";
            }
        }

        if (
            field === "designation"
        ) {
            if (!value) {
                error =
                    "Designation is required";
            }
        }

        if (
            field === "joiningDate"
        ) {
            if (!value) {
                error =
                    "Joining date is required";
            } else {
                const today =
                    new Date()
                        .toISOString()
                        .split("T")[0];

                if (value > today) {
                    error =
                        "Joining date cannot be in the future";
                }
            }
        }

        if (field === "salary") {
            if (
                value === "" ||
                value === null
            ) {
                error =
                    "Salary is required";
            } else if (
                Number(value) <= 0
            ) {
                error =
                    "Salary must be greater than zero";
            }
        }

        if (field === "status") {
            if (!value) {
                error =
                    "Status is required";
            }
        }

        setErrors(
            (previous) => ({
                ...previous,
                [field]: error
            })
        );

        return error;
    };

    const validateAllFields =
        () => {
            const fields = [
                "name",
                "email",
                "phone",
                "department",
                "designation",
                "joiningDate",
                "salary",
                "status"
            ];

            let isValid = true;

            fields.forEach(
                (field) => {
                    const fieldError =
                        validateField(
                            field,
                            formData[field]
                        );

                    if (fieldError) {
                        isValid = false;
                    }
                }
            );

            return isValid;
        };

    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setFormData(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );

        /*
         * Remove the old error as the user
         * changes the field.
         */
        if (errors[name]) {
            setErrors(
                (previous) => ({
                    ...previous,
                    [name]: ""
                })
            );
        }
    };

    const handleBlur = (e) => {
        const {
            name,
            value
        } = e.target;

        validateField(
            name,
            value
        );
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateAllFields()) {
            toast.error(
                "Please fix the errors in the form"
            );
            return;
        }

        try {
            setSubmitting(true);

            /*
             * Send all editable fields.
             *
             * Empty email/phone/workLocation
             * are intentionally sent as empty
             * strings so they can be cleared.
             */
            const payload = {
                name:
                    formData.name.trim(),

                email:
                    formData.email
                        .trim()
                        .toLowerCase(),

                phone:
                    formData.phone.trim(),

                workLocation:
                    formData.workLocation.trim(),

                department:
                    formData.department,

                designation:
                    formData.designation,

                joiningDate:
                    formData.joiningDate,

                employmentType:
                    formData.employmentType,

                salary:
                    Number(
                        formData.salary
                    ),

                status:
                    formData.status
            };

            await api.put(
                `/employees/${id}`,
                payload
            );

            toast.success(
                "Employee Updated Successfully"
            );

            /*
             * Return to the same page from
             * which Edit was opened.
             */
            navigate(
                `/employees?page=${returnPage}`,
                {
                    replace: true
                }
            );
        } catch (error) {
            toast.error(
                error.response
                    ?.data?.message ||
                "Failed to update employee"
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (
        employeeLoading ||
        optionsLoading
    ) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    if (optionsError) {
        return (
            <Layout>
                <ErrorState
                    title="Unable to Load Form Options"
                    message="Departments and designations are required to update this employee."
                    action={() =>
                        window.location.reload()
                    }
                    actionText="Try Again"
                />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>
                        Edit Employee
                    </h1>

                    <p>
                        Update employee record
                        details
                    </p>
                </div>
            </div>

            <div
                className="form-container"
                style={{
                    maxWidth: 880
                }}
            >
                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <h3
                        style={{
                            marginTop: 0
                        }}
                    >
                        Personal Information
                    </h3>

                    <div className="form-row">
                        <FormField
                            label="Full Name"
                            name="name"
                            type="text"
                            value={
                                formData.name
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.name
                            }
                            required
                            placeholder="Enter full name"
                        />

                        <FormField
                            label="Work Email"
                            name="email"
                            type="email"
                            value={
                                formData.email
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.email
                            }
                            placeholder="employee@company.com"
                        />
                    </div>

                    <div className="form-row">
                        <FormField
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            value={
                                formData.phone
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.phone
                            }
                            placeholder="+1 (555) 123-4567"
                        />

                        <FormField
                            label="Work Location"
                            name="workLocation"
                            type="text"
                            value={
                                formData.workLocation
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="e.g., New York Office"
                        />
                    </div>

                    <h3>
                        Employment Information
                    </h3>

                    <div className="form-row">
                        <FormField
                            label="Department"
                            name="department"
                            type="select"
                            value={
                                formData.department
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.department
                            }
                            required
                            options={
                                departmentOptions
                            }
                            emptyLabel="Select Department"
                            helperText={
                                departmentOptions.length ===
                                0
                                    ? "No active departments available. Please create a department first."
                                    : undefined
                            }
                        />

                        <FormField
                            label="Designation"
                            name="designation"
                            type="select"
                            value={
                                formData.designation
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.designation
                            }
                            required
                            options={
                                designationOptions
                            }
                            emptyLabel="Select Designation"
                            helperText={
                                designationOptions.length ===
                                0
                                    ? "No active designations available. Please create a designation first."
                                    : undefined
                            }
                        />
                    </div>

                    <div className="form-row">
                        <FormField
                            label="Joining Date"
                            name="joiningDate"
                            type="date"
                            value={
                                formData.joiningDate
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.joiningDate
                            }
                            required
                            max={
                                new Date()
                                    .toISOString()
                                    .split(
                                        "T"
                                    )[0]
                            }
                        />

                        <FormField
                            label="Employment Type"
                            name="employmentType"
                            type="select"
                            value={
                                formData.employmentType
                            }
                            onChange={
                                handleChange
                            }
                            options={[
                                {
                                    value:
                                        "Full-time",
                                    label:
                                        "Full-time"
                                },
                                {
                                    value:
                                        "Part-time",
                                    label:
                                        "Part-time"
                                },
                                {
                                    value:
                                        "Contract",
                                    label:
                                        "Contract"
                                },
                                {
                                    value:
                                        "Intern",
                                    label:
                                        "Intern"
                                }
                            ]}
                        />
                    </div>

                    <h3>
                        Compensation &amp;
                        Status
                    </h3>

                    <div className="form-row">
                        <FormField
                            label="Salary"
                            name="salary"
                            type="number"
                            value={
                                formData.salary
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.salary
                            }
                            required
                            placeholder="Enter salary"
                            min="0"
                            step="0.01"
                        />

                        <FormField
                            label="Employment Status"
                            name="status"
                            type="select"
                            value={
                                formData.status
                            }
                            onChange={
                                handleChange
                            }
                            onBlur={
                                handleBlur
                            }
                            error={
                                errors.status
                            }
                            required
                            options={[
                                {
                                    value:
                                        "Active",
                                    label:
                                        "Active"
                                },
                                {
                                    value:
                                        "Inactive",
                                    label:
                                        "Inactive"
                                }
                            ]}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                navigate(
                                    `/employees?page=${returnPage}`
                                )
                            }
                            disabled={
                                submitting
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={`btn btn-primary ${
                                submitting
                                    ? "is-loading"
                                    : ""
                            }`}
                            disabled={
                                submitting ||
                                departmentOptions.length ===
                                    0 ||
                                designationOptions.length ===
                                    0
                            }
                        >
                            {submitting
                                ? "Updating..."
                                : "Update Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default EditEmployee;