import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import { FormField, LoadingSpinner, ErrorState } from "../components/FormField";
import { toast } from "react-toastify";
import { buildDepartmentOptions } from "../utils/department";
import { buildDesignationOptions } from "../utils/designation";
import '../styles/design-system.css';

function AddEmployee() {
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        salary: "",
        designation: "",
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
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchOptions() {
            setOptionsLoading(true);
            setOptionsError(false);

            try {
                const [departmentsResponse, designationsResponse] = await Promise.all([
                    api.get("/departments"),
                    api.get("/designations")
                ]);
                setDepartments(departmentsResponse.data || []);
                setDesignations(designationsResponse.data || []);
            } catch (error) {
                setOptionsError(true);
                toast.error(
                    error.response?.data?.message ||
                    "Failed to load form options"
                );
            } finally {
                setOptionsLoading(false);
            }
        }

        fetchOptions();
    }, []);

    const activeDepartments = departments.filter((dept) => dept.status === "Active");
    const activeDesignations = designations.filter((item) => item.status === "Active");
    const departmentOptions = buildDepartmentOptions(departments);
    const designationOptions = buildDesignationOptions(designations);

    const validateField = (field, value) => {
        let error = "";

        if (field === "name") {
            if (!value.trim()) {
                error = "Name is required";
            } else if (value.trim().length < 2) {
                error = "Name must contain at least 2 characters";
            } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) {
                error = "Name should contain only letters and spaces";
            }
        }

        if (field === "salary") {
            if (!value) {
                error = "Salary is required";
            } else if (Number(value) <= 0) {
                error = "Salary must be greater than 0";
            }
        }

        if (field === "department") {
            if (!value) {
                error = "Department is required";
            }
        }

        if (field === "designation") {
            if (!value) {
                error = "Designation is required";
            }
        }

        if (field === "joiningDate") {
            if (!value) {
                error = "Joining date is required";
            } else {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                if (selectedDate > today) {
                    error = "Joining date cannot be in the future";
                }
            }
        }

        if (field === "status") {
            if (!value) {
                error = "Status is required";
            }
        }

        if (field === "email" && value) {
            if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value.trim())) {
                error = "Enter a valid email address";
            }
        }

        if (field === "phone" && value) {
            if (!/^[0-9+()\-\s]{7,20}$/.test(value.trim())) {
                error = "Enter a valid phone number";
            }
        }

        setErrors((prev) => ({
            ...prev,
            [field]: error
        }));

        return error === "";
    };

    const validateAllFields = () => {
        const fieldsToValidate = ["name", "department", "designation", "joiningDate", "salary", "status"];
        let isValid = true;

        fieldsToValidate.forEach(field => {
            if (!validateField(field, formData[field])) {
                isValid = false;
            }
        });

        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAllFields()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name.trim(),
                salary: Number(formData.salary),
                department: formData.department,
                designation: formData.designation,
                joiningDate: formData.joiningDate,
                status: formData.status,
                ...(formData.email && { email: formData.email.toLowerCase().trim() }),
                ...(formData.phone && { phone: formData.phone.trim() }),
                ...(formData.workLocation && { workLocation: formData.workLocation.trim() }),
                ...(formData.employmentType && { employmentType: formData.employmentType })
            };

            await api.post("/employees", payload);

            toast.success("Employee created successfully");
            navigate("/employees");
        } catch (error) {
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
                    message="Departments and designations are required before adding an employee."
                    action={() => window.location.reload()}
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
                    <p>Create a new employee record</p>
                </div>
            </div>

            <div className="form-container" style={{ maxWidth: 880 }}>
                <form onSubmit={handleSubmit}>
                    <h3 style={{ marginTop: 0 }}>Personal Information</h3>

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

                    <h3>Employment Information</h3>

                    <div className="form-row">
                        <FormField
                            label="Department"
                            name="department"
                            type="select"
                            value={formData.department}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.department}
                            required
                            disabled={activeDepartments.length === 0}
                            options={departmentOptions}
                            emptyLabel="Select Department"
                            helperText={
                                activeDepartments.length === 0
                                    ? "No active departments available. Please create a department first."
                                    : undefined
                            }
                        />

                        <FormField
                            label="Designation"
                            name="designation"
                            type="select"
                            value={formData.designation}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.designation}
                            required
                            disabled={activeDesignations.length === 0}
                            options={designationOptions}
                            emptyLabel="Select Designation"
                            helperText={
                                activeDesignations.length === 0
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
                            value={formData.joiningDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.joiningDate}
                            required
                        />

                        <FormField
                            label="Employment Type"
                            name="employmentType"
                            type="select"
                            value={formData.employmentType}
                            onChange={handleChange}
                            options={[
                                { value: "Full-time", label: "Full-time" },
                                { value: "Part-time", label: "Part-time" },
                                { value: "Contract", label: "Contract" },
                                { value: "Intern", label: "Intern" }
                            ]}
                        />
                    </div>

                    <h3>Compensation &amp; Status</h3>

                    <div className="form-row">
                        <FormField
                            label="Salary"
                            name="salary"
                            type="number"
                            value={formData.salary}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.salary}
                            required
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />

                        <FormField
                            label="Employment Status"
                            name="status"
                            type="select"
                            value={formData.status}
                            onChange={handleChange}
                            error={errors.status}
                            required
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate("/employees")}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'is-loading' : ''}`}
                            disabled={loading || activeDepartments.length === 0 || activeDesignations.length === 0}
                        >
                            {loading ? "Creating..." : "Add Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default AddEmployee;