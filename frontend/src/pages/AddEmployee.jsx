import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import {
    FormField,
    LoadingSpinner,
    ErrorState
} from "../components/FormField";
import { toast } from "react-toastify";
import { buildDepartmentOptions } from "../utils/department";
import { buildDesignationOptions } from "../utils/designation";
import "../styles/design-system.css";

function AddEmployee() {
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        designation: "",
        salary: "",
        joiningDate: "",
        status: "Active",
        phone: "",
        email: "",
        workLocation: "",
        employmentType: "Full-time"
    });

    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [optionsLoading, setOptionsLoading] = useState(true);
    const [optionsError, setOptionsError] = useState(false);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [addingDepartment, setAddingDepartment] =
        useState(false);

    const [addingDesignation, setAddingDesignation] =
        useState(false);

    const [newDepartmentName, setNewDepartmentName] =
        useState("");

    const [newDesignationName, setNewDesignationName] =
        useState("");

    const [departmentExists, setDepartmentExists] =
        useState(false);

    const [designationExists, setDesignationExists] =
        useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const fetchOptions = async () => {
            setOptionsLoading(true);
            setOptionsError(false);

            try {
                const [
                    departmentsResponse,
                    designationsResponse
                ] = await Promise.all([
                    api.get("/departments"),
                    api.get("/designations")
                ]);

                if (!mounted) {
                    return;
                }

                setDepartments(
                    Array.isArray(
                        departmentsResponse.data
                    )
                        ? departmentsResponse.data
                        : []
                );

                setDesignations(
                    Array.isArray(
                        designationsResponse.data
                    )
                        ? designationsResponse.data
                        : []
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }


                setOptionsError(true);

                toast.error(
                    error.response?.data?.message ||
                    "Failed to load departments and designations"
                );
            } finally {
                if (mounted) {
                    setOptionsLoading(false);
                }
            }
        };

        fetchOptions();

        return () => {
            mounted = false;
        };
    }, []);

    const departmentOptions =
        buildDepartmentOptions(departments);

    const designationOptions =
        buildDesignationOptions(designations);

    const findExistingDepartment = (name) => {
        const value = name.trim().toLowerCase();

        if (!value) {
            return null;
        }

        return departments.find(
            (department) =>
                department.name
                    ?.trim()
                    .toLowerCase() === value
        );
    };

    const findExistingDesignation = (name) => {
        const value = name.trim().toLowerCase();

        if (!value) {
            return null;
        }

        return designations.find(
            (designation) =>
                designation.name
                    ?.trim()
                    .toLowerCase() === value
        );
    };

    const validateField = (field, value) => {
        let error = "";

        if (field === "name") {
            const name = String(value || "").trim();

            if (!name) {
                error = "Name is required";
            } else if (name.length < 2) {
                error =
                    "Name must contain at least 2 characters";
            } else if (name.length > 50) {
                error =
                    "Name cannot exceed 50 characters";
            } else if (
                !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)
            ) {
                error =
                    "Name should contain only letters and spaces";
            }
        }

        if (field === "salary") {
            if (
                value === "" ||
                value === null ||
                value === undefined
            ) {
                error = "Salary is required";
            } else if (
                Number.isNaN(Number(value)) ||
                Number(value) <= 0
            ) {
                error =
                    "Salary must be greater than 0";
            }
        }

        if (field === "department") {
            if (addingDepartment) {
                const name =
                    newDepartmentName.trim();

                if (!name) {
                    error =
                        "Department name is required";
                } else if (name.length < 2) {
                    error =
                        "Department name must contain at least 2 characters";
                } else if (name.length > 50) {
                    error =
                        "Department name cannot exceed 50 characters";
                } else if (
                    !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                        name
                    )
                ) {
                    error =
                        "Department name should contain only letters and spaces";
                } else if (
                    findExistingDepartment(name)
                ) {
                    error =
                        "Department already exists. Select it from the list.";
                }
            } else if (!value) {
                error = "Department is required";
            }
        }

        if (field === "designation") {
            if (addingDesignation) {
                const name =
                    newDesignationName.trim();

                if (!name) {
                    error =
                        "Designation name is required";
                } else if (name.length < 2) {
                    error =
                        "Designation name must contain at least 2 characters";
                } else if (name.length > 50) {
                    error =
                        "Designation name cannot exceed 50 characters";
                } else if (
                    !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                        name
                    )
                ) {
                    error =
                        "Designation name should contain only letters and spaces";
                } else if (
                    findExistingDesignation(name)
                ) {
                    error =
                        "Designation already exists. Select it from the list.";
                }
            } else if (!value) {
                error = "Designation is required";
            }
        }

        if (field === "joiningDate") {
            if (!value) {
                error =
                    "Joining date is required";
            } else {
                const selectedDate =
                    new Date(`${value}T00:00:00`);

                const today = new Date();

                today.setHours(
                    23,
                    59,
                    59,
                    999
                );

                if (
                    Number.isNaN(
                        selectedDate.getTime()
                    )
                ) {
                    error =
                        "Joining date must be valid";
                } else if (
                    selectedDate > today
                ) {
                    error =
                        "Joining date cannot be in the future";
                }
            }
        }

        if (field === "status") {
            if (
                !["Active", "Inactive"].includes(
                    value
                )
            ) {
                error = "Status is required";
            }
        }

        if (field === "email" && value) {
            if (
                !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
                    value.trim()
                )
            ) {
                error =
                    "Enter a valid email address";
            }
        }

        if (field === "phone" && value) {
            if (
                !/^[0-9+()\-\s]{7,20}$/.test(
                    value.trim()
                )
            ) {
                error =
                    "Enter a valid phone number";
            }
        }

        setErrors((previous) => ({
            ...previous,
            [field]: error
        }));

        return !error;
    };

    const validateAllFields = () => {
    let isValid = true;

    const fields = [
        "name",
        "joiningDate",
        "salary",
        "status",
        "email",
        "phone"
    ];

    fields.forEach((field) => {
        const valid = validateField(
            field,
            formData[field]
        );

        if (!valid) {
            isValid = false;
        }
    });

    /*
     * Department
     */
    if (addingDepartment) {
        const departmentName =
            newDepartmentName.trim();

        if (!departmentName) {
            setErrors((previous) => ({
                ...previous,
                department:
                    "Department name is required"
            }));

            isValid = false;
        } else if (
            departmentExists
        ) {
            setErrors((previous) => ({
                ...previous,
                department:
                    "Department already exists. Please select it from the dropdown."
            }));

            isValid = false;
        } else if (
            !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                departmentName
            )
        ) {
            setErrors((previous) => ({
                ...previous,
                department:
                    "Department name should contain only letters and spaces"
            }));

            isValid = false;
        } else {
            setErrors((previous) => ({
                ...previous,
                department: ""
            }));
        }
    } else {
        const valid =
            Boolean(formData.department);

        setErrors((previous) => ({
            ...previous,
            department: valid
                ? ""
                : "Department is required"
        }));

        if (!valid) {
            isValid = false;
        }
    }

    /*
     * Designation
     */
    if (addingDesignation) {
        const designationName =
            newDesignationName.trim();

        if (!designationName) {
            setErrors((previous) => ({
                ...previous,
                designation:
                    "Designation name is required"
            }));

            isValid = false;
        } else if (
            designationExists
        ) {
            setErrors((previous) => ({
                ...previous,
                designation:
                    "Designation already exists. Please select it from the dropdown."
            }));

            isValid = false;
        } else if (
            !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                designationName
            )
        ) {
            setErrors((previous) => ({
                ...previous,
                designation:
                    "Designation name should contain only letters and spaces"
            }));

            isValid = false;
        } else {
            setErrors((previous) => ({
                ...previous,
                designation: ""
            }));
        }
    } else {
        const valid =
            Boolean(formData.designation);

        setErrors((previous) => ({
            ...previous,
            designation: valid
                ? ""
                : "Designation is required"
        }));

        if (!valid) {
            isValid = false;
        }
    }

    return isValid;
};
    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (errors[name]) {
            setErrors((previous) => ({
                ...previous,
                [name]: ""
            }));
        }
    };

    const handleBlur = (e) => {
        const {
            name,
            value
        } = e.target;

        validateField(name, value);
    };

    const handleDepartmentSelect = (e) => {
    const value = e.target.value;

    if (value === "__NEW__") {
        setAddingDepartment(true);
        setNewDepartmentName("");
        setDepartmentExists(false);

        setFormData((previous) => ({
            ...previous,
            department: ""
        }));

        setErrors((previous) => ({
            ...previous,
            department: ""
        }));

        return;
    }

    setAddingDepartment(false);
    setNewDepartmentName("");
    setDepartmentExists(false);

    setFormData((previous) => ({
        ...previous,
        department: value
    }));

    setErrors((previous) => ({
        ...previous,
        department: ""
    }));
};
    const handleDesignationSelect = (e) => {
    const value = e.target.value;

    if (value === "__NEW__") {
        setAddingDesignation(true);
        setNewDesignationName("");
        setDesignationExists(false);

        setFormData((previous) => ({
            ...previous,
            designation: ""
        }));

        setErrors((previous) => ({
            ...previous,
            designation: ""
        }));

        return;
    }

    setAddingDesignation(false);
    setNewDesignationName("");
    setDesignationExists(false);

    setFormData((previous) => ({
        ...previous,
        designation: value
    }));

    setErrors((previous) => ({
        ...previous,
        designation: ""
    }));
};

   const handleNewDepartmentChange = (e) => {
    const value = e.target.value;

    setNewDepartmentName(value);

    const existing =
        findExistingDepartment(value);

    setDepartmentExists(Boolean(existing));

    setErrors((previous) => ({
        ...previous,
        department: ""
    }));
};

   const handleNewDesignationChange = (e) => {
    const value = e.target.value;

    setNewDesignationName(value);

    const existing =
        findExistingDesignation(value);

    setDesignationExists(Boolean(existing));

    setErrors((previous) => ({
        ...previous,
        designation: ""
    }));
};

    const cancelNewDepartment = () => {
        setAddingDepartment(false);
        setNewDepartmentName("");
        setDepartmentExists(false);

        setFormData((previous) => ({
            ...previous,
            department: ""
        }));

        setErrors((previous) => ({
            ...previous,
            department: ""
        }));
    };

    const cancelNewDesignation = () => {
        setAddingDesignation(false);
        setNewDesignationName("");
        setDesignationExists(false);

        setFormData((previous) => ({
            ...previous,
            designation: ""
        }));

        setErrors((previous) => ({
            ...previous,
            designation: ""
        }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    const valid = validateAllFields();

    if (!valid) {
        toast.error(
            "Please fix the errors in the form"
        );
        return;
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE NEW DEPARTMENT
     * ---------------------------------------------------------
     */

    if (addingDepartment) {
        const departmentName =
            newDepartmentName.trim();

        if (!departmentName) {
            setErrors((previous) => ({
                ...previous,
                department:
                    "Department name is required"
            }));

            toast.error(
                "Department name is required"
            );

            return;
        }

        if (departmentExists) {
            setErrors((previous) => ({
                ...previous,
                department:
                    "Department already exists. Please select it from the dropdown."
            }));

            toast.error(
                "Department already exists"
            );

            return;
        }
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE NEW DESIGNATION
     * ---------------------------------------------------------
     */

    if (addingDesignation) {
        const designationName =
            newDesignationName.trim();

        if (!designationName) {
            setErrors((previous) => ({
                ...previous,
                designation:
                    "Designation name is required"
            }));

            toast.error(
                "Designation name is required"
            );

            return;
        }

        if (designationExists) {
            setErrors((previous) => ({
                ...previous,
                designation:
                    "Designation already exists. Please select it from the dropdown."
            }));

            toast.error(
                "Designation already exists"
            );

            return;
        }
    }

    /*
     * ---------------------------------------------------------
     * BUILD PAYLOAD
     * ---------------------------------------------------------
     */

  const payload = {
    name: formData.name.trim(),

    salary: Number(formData.salary),

    joiningDate: formData.joiningDate,

    status: formData.status,

    ...(formData.email && {
        email: formData.email
            .trim()
            .toLowerCase()
    }),

    ...(formData.phone && {
        phone: formData.phone.trim()
    }),

    ...(formData.workLocation && {
        workLocation:
            formData.workLocation.trim()
    }),

    employmentType:
        formData.employmentType || "Full-time"
};

/*
 * Department
 */
if (addingDepartment) {
    payload.newDepartmentName =
        newDepartmentName.trim();
} else {
    payload.department =
        formData.department;
}

/*
 * Designation
 */
if (addingDesignation) {
    payload.newDesignationName =
        newDesignationName.trim();
} else {
    payload.designation =
        formData.designation;
}

     try {
        setLoading(true);

        await api.post("/employees", payload);

        toast.success(
            "Employee created successfully"
        );

        navigate("/employees");

    } catch (error) {
        const backendErrors =
            error.response?.data?.errors;

        if (backendErrors) {
            setErrors(backendErrors);
        }

        toast.error(
            error.response?.data?.message ||
            "Failed to create employee"
        );

    } finally {
        setLoading(false);
    }
};


    if (optionsLoading) {
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
                    message="Departments and designations could not be loaded."
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
                    <h1>Add Employee</h1>
                    <p>
                        Create a new employee record
                    </p>
                </div>
            </div>

            <div
                className="form-container"
                style={{ maxWidth: 880 }}
            >
                <form onSubmit={handleSubmit}>
                    <h3 style={{ marginTop: 0 }}>
                        Personal Information
                    </h3>

                    <div className="form-row">
                        <FormField
                            label="Full Name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.name}
                            required
                            placeholder="Enter full name"
                        />

                        <FormField
                            label="Work Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.email}
                            placeholder="employee@company.com"
                        />
                    </div>

                    <div className="form-row">
                        <FormField
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.phone}
                            placeholder="+1 (555) 123-4567"
                        />

                        <FormField
                            label="Work Location"
                            name="workLocation"
                            type="text"
                            value={formData.workLocation}
                            onChange={handleChange}
                            placeholder="e.g., New York Office"
                        />
                    </div>

                    <h3>
                        Employment Information
                    </h3>

                    <div className="form-row">

                        {/* Department */}
                        <div>
                            {!addingDepartment ? (
                                <FormField
                                    label="Department"
                                    name="department"
                                    type="select"
                                    value={
                                        formData.department
                                    }
                                    onChange={
                                        handleDepartmentSelect
                                    }
                                    onBlur={
                                        handleBlur
                                    }
                                    error={
                                        errors.department
                                    }
                                    required
                                    options={[
                                        ...departmentOptions,
                                        {
                                            value: "__NEW__",
                                            label:
                                                "+ Add New Department"
                                        }
                                    ]}
                                    emptyLabel="Select Department"
                                />
                            ) : (
                                <div className="form-field">
                                    <label>
                                        New Department
                                        <span className="required-mark">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newDepartmentName
                                        }
                                        onChange={
                                            handleNewDepartmentChange
                                        }
                                        onBlur={() =>
                                            validateField(
                                                "department",
                                                newDepartmentName
                                            )
                                        }
                                        placeholder="Type department name"
                                        maxLength={50}
                                        autoFocus
                                    />

                                    {newDepartmentName.trim() &&
                                        departmentExists && (
                                            <div
                                                style={{
                                                    marginTop:
                                                        "6px",
                                                    fontSize:
                                                        "13px",
                                                    color:
                                                        "#dc2626"
                                                }}
                                            >
                                                Department already exists.
                                                Please select it from the
                                                dropdown.
                                            </div>
                                        )}

                                    {newDepartmentName.trim() &&
                                        !departmentExists && (
                                            <div
                                                style={{
                                                    marginTop:
                                                        "6px",
                                                    fontSize:
                                                        "13px",
                                                    color:
                                                        "#15803d"
                                                }}
                                            >
                                                ✓ New department will be
                                                created when the employee
                                                is added.
                                            </div>
                                        )}

                                    {errors.department && (
                                        <div className="field-error">
                                            {
                                                errors.department
                                            }
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={
                                            cancelNewDepartment
                                        }
                                        disabled={
                                            loading
                                        }
                                        style={{
                                            marginTop:
                                                "8px"
                                        }}
                                    >
                                        ← Select Existing
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Designation */}
                        <div>
                            {!addingDesignation ? (
                                <FormField
                                    label="Designation"
                                    name="designation"
                                    type="select"
                                    value={
                                        formData.designation
                                    }
                                    onChange={
                                        handleDesignationSelect
                                    }
                                    onBlur={
                                        handleBlur
                                    }
                                    error={
                                        errors.designation
                                    }
                                    required
                                    options={[
                                        ...designationOptions,
                                        {
                                            value: "__NEW__",
                                            label:
                                                "+ Add New Designation"
                                        }
                                    ]}
                                    emptyLabel="Select Designation"
                                />
                            ) : (
                                <div className="form-field">
                                    <label>
                                        New Designation
                                        <span className="required-mark">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newDesignationName
                                        }
                                        onChange={
                                            handleNewDesignationChange
                                        }
                                        onBlur={() =>
                                            validateField(
                                                "designation",
                                                newDesignationName
                                            )
                                        }
                                        placeholder="Type designation name"
                                        maxLength={50}
                                        autoFocus
                                    />

                                    {newDesignationName.trim() &&
                                        designationExists && (
                                            <div
                                                style={{
                                                    marginTop:
                                                        "6px",
                                                    fontSize:
                                                        "13px",
                                                    color:
                                                        "#dc2626"
                                                }}
                                            >
                                                Designation already exists.
                                                Please select it from the
                                                dropdown.
                                            </div>
                                        )}

                                    {newDesignationName.trim() &&
                                        !designationExists && (
                                            <div
                                                style={{
                                                    marginTop:
                                                        "6px",
                                                    fontSize:
                                                        "13px",
                                                    color:
                                                        "#15803d"
                                                }}
                                            >
                                                ✓ New designation will be
                                                created when the employee
                                                is added.
                                            </div>
                                        )}

                                    {errors.designation && (
                                        <div className="field-error">
                                            {
                                                errors.designation
                                            }
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={
                                            cancelNewDesignation
                                        }
                                        disabled={
                                            loading
                                        }
                                        style={{
                                            marginTop:
                                                "8px"
                                        }}
                                    >
                                        ← Select Existing
                                    </button>
                                </div>
                            )}
                        </div>
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
                                    .split("T")[0]
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
                        Compensation &amp; Status
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
                            placeholder="0.00"
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
                                    "/employees"
                                )
                            }
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={`btn btn-primary ${
                                loading
                                    ? "is-loading"
                                    : ""
                            }`}
                            disabled={loading}
                        >
                            {loading
                                ? "Creating..."
                                : "Add Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default AddEmployee;