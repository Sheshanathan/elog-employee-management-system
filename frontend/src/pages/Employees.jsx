import { useEffect, useRef, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ConfirmationModal,
    StatusBadge,
    LoadingSpinner,
    ResultsSummary,
    RowActionsMenu
} from "../components/FormField";
import { getDepartmentName } from "../utils/department";
import { getDesignationName } from "../utils/designation";
import { matchesSearch } from "../utils/search";
import { formatCurrency } from "../utils/currency";
import "../styles/design-system.css";
import { downloadCSV, parseCSV } from "../utils/csv";

function formatShortDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
    });
}

/*
 * Converts imported dates into YYYY-MM-DD.
 *
 * Supported:
 * 2026-04-23
 * 23/04/26
 * 23/04/2026
 * 23-04-26
 * 23-04-2026
 */
function normalizeImportDate(value) {
    if (!value) return "";

    const date = String(value).trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }

    // DD/MM/YY or DD/MM/YYYY
    const slashMatch = date.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/
    );

    if (slashMatch) {
        let [, day, month, year] = slashMatch;

        if (year.length === 2) {
            year = `20${year}`;
        }

        const dayNumber = Number(day);
        const monthNumber = Number(month);

        if (
            dayNumber >= 1 &&
            dayNumber <= 31 &&
            monthNumber >= 1 &&
            monthNumber <= 12
        ) {
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
    }

    // DD-MM-YY or DD-MM-YYYY
    const dashMatch = date.match(
        /^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/
    );

    if (dashMatch) {
        let [, day, month, year] = dashMatch;

        if (year.length === 2) {
            year = `20${year}`;
        }

        const dayNumber = Number(day);
        const monthNumber = Number(month);

        if (
            dayNumber >= 1 &&
            dayNumber <= 31 &&
            monthNumber >= 1 &&
            monthNumber <= 12
        ) {
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
    }

    return date;
}

function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    const [
        deleteConfirm,
        setDeleteConfirm
    ] = useState({
        isOpen: false,
        employeeId: null,
        employeeName: ""
    });

    const [deleteLoading, setDeleteLoading] = useState(false);

    const [importing, setImporting] = useState(false);
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [importPreviewRows, setImportPreviewRows] = useState([]);
    const [importErrors, setImportErrors] = useState([]);

    const fileInputRef = useRef(null);

    const employeesPerPage = 10;

    const navigate = useNavigate();

    const role = localStorage.getItem("role");

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);

        try {
            const response = await api.get("/employees");

            setEmployees(response.data || []);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load employees"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (
        employeeId,
        employeeName
    ) => {
        setDeleteConfirm({
            isOpen: true,
            employeeId,
            employeeName
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.employeeId) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete(
                `/employees/${deleteConfirm.employeeId}`
            );

            toast.success(
                "Employee deleted successfully"
            );

            setEmployees((prev) =>
                prev.filter(
                    (employee) =>
                        employee._id !==
                        deleteConfirm.employeeId
                )
            );

            setDeleteConfirm({
                isOpen: false,
                employeeId: null,
                employeeName: ""
            });

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to delete employee"
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredEmployees = (
        employees || []
    ).filter((employee) => {

        const matchesSearchQuery =
            matchesSearch(
                search,
                employee.name,
                employee.employeeId,
                getDepartmentName(
                    employee.department
                ),
                getDesignationName(
                    employee.designation
                )
            );

        const matchesStatus =
            statusFilter === "All" ||
            employee.status === statusFilter;

        return (
            matchesSearchQuery &&
            matchesStatus
        );
    });

    /*
     * EXPORT
     *
     * Always export joiningDate as YYYY-MM-DD.
     * This prevents exported dates such as 23/04/26
     * from causing import problems later.
     */
    const handleExport = () => {
        downloadCSV(
            "employees",
            filteredEmployees,
            [
                {
                    key: "employeeId",
                    label: "Employee ID",
                    format: (employee) =>
                        employee.employeeId ?? ""
                },
                {
                    key: "name",
                    label: "Name",
                    format: (employee) =>
                        employee.name ?? ""
                },
                {
    label: "Department",
    format: (employee) =>
        employee.department?.name || "",
},
{
    label: "Designation",
    format: (employee) =>
        employee.designation?.name || "",
},
                {
                    label: "Joining Date",
                    format: (employee) => {
                        if (!employee.joiningDate) {
                            return "";
                        }

                        const date = new Date(
                            employee.joiningDate
                        );

                        if (
                            Number.isNaN(
                                date.getTime()
                            )
                        ) {
                            return "";
                        }

                        return date
                            .toISOString()
                            .split("T")[0];
                    }
                },
                {
                    key: "salary",
                    label: "Salary",
                    format: (employee) =>
                        employee.salary ?? ""
                },
                {
                    key: "status",
                    label: "Status",
                    format: (employee) =>
                        employee.status ?? ""
                }
            ]
        );
    };

    /*
     * IMPORT CSV
     *
     * Selecting a CSV DOES NOT create employees.
     * It only reads, normalizes and validates
     * the file and then opens the preview.
     */
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];

        // Allow selecting the same file again
        e.target.value = "";

        if (!file) {
            return;
        }

        try {
            const rows =
                parseCSV(await file.text());

            if (rows.length === 0) {
                toast.error(
                    "The CSV file has no data rows"
                );
                return;
            }

            const headerMap = {
                "employee id": "employeeId",
                "employeeid": "employeeId",
                "name": "name",
                "department": "department",
                "designation": "designation",
                "joining date": "joiningDate",
                "joiningdate": "joiningDate",
                "salary": "salary",
                "status": "status"
            };

            const normalizedRows =
                rows.map((row, index) => {

                    const normalizedRow = {
                        _previewRow: index + 1,
                        employeeId: "",
                        name: "",
                        department: "",
                        designation: "",
                        joiningDate: "",
                        salary: "",
                        status: ""
                    };

                    Object.entries(row).forEach(
                        ([key, value]) => {

                            const normalizedKey =
                                key
                                    .trim()
                                    .toLowerCase()
                                    .replace(
                                        /\s+/g,
                                        " "
                                    );

                            const mappedKey =
                                headerMap[
                                    normalizedKey
                                ];

                            if (!mappedKey) {
                                return;
                            }

                            let normalizedValue =
                                value === null ||
                                value === undefined
                                    ? ""
                                    : String(
                                        value
                                    ).trim();

                            if (
                                mappedKey ===
                                "employeeId"
                            ) {
                                normalizedValue =
                                    normalizedValue
                                        .toUpperCase();
                            }

                            if (
                                mappedKey ===
                                "joiningDate"
                            ) {
                                normalizedValue =
                                    normalizeImportDate(
                                        normalizedValue
                                    );
                            }

                            normalizedRow[
                                mappedKey
                            ] =
                                normalizedValue;
                        }
                    );

                    return normalizedRow;
                });

            const errors = [];

            /*
             * Validate each row
             */
            normalizedRows.forEach((row) => {

                const rowErrors = [];

                if (!row.name.trim()) {
                    rowErrors.push(
                        "Name is required"
                    );
                }

                if (!row.department.trim()) {
                    rowErrors.push(
                        "Department is required"
                    );
                }

                if (!row.designation.trim()) {
                    rowErrors.push(
                        "Designation is required"
                    );
                }

                if (!row.salary.trim()) {
                    rowErrors.push(
                        "Salary is required"
                    );
                } else if (
                    Number.isNaN(
                        Number(row.salary)
                    ) ||
                    Number(row.salary) <= 0
                ) {
                    rowErrors.push(
                        "Salary must be a valid number greater than 0"
                    );
                }

                if (!row.joiningDate.trim()) {

                    rowErrors.push(
                        "Joining Date is required"
                    );

                } else if (
                    !isValidDateString(
                        row.joiningDate
                    )
                ) {

                    rowErrors.push(
                        "Joining Date must be a valid date"
                    );

                } else {

                    const joiningDate =
                        new Date(
                            `${row.joiningDate}T00:00:00`
                        );

                    const today =
                        new Date();

                    today.setHours(
                        23,
                        59,
                        59,
                        999
                    );

                    if (
                        joiningDate >
                        today
                    ) {
                        rowErrors.push(
                            "Joining Date cannot be in the future"
                        );
                    }
                }

                if (!row.status.trim()) {
                    rowErrors.push(
                        "Status is required"
                    );
                } else if (
                    ![
                        "Active",
                        "Inactive"
                    ].includes(
                        row.status
                    )
                ) {
                    rowErrors.push(
                        "Status must be Active or Inactive"
                    );
                }

                if (rowErrors.length > 0) {
                    errors.push({
                        row:
                            row._previewRow,
                        message:
                            rowErrors.join(
                                ", "
                            )
                    });
                }
            });

            /*
             * Check duplicate Employee IDs
             * inside the uploaded CSV.
             */
            const csvEmployeeIds =
                new Map();

            normalizedRows.forEach(
                (row) => {

                    if (
                        !row.employeeId.trim()
                    ) {
                        return;
                    }

                    const employeeId =
                        row.employeeId
                            .trim()
                            .toUpperCase();

                    if (
                        csvEmployeeIds.has(
                            employeeId
                        )
                    ) {

                        errors.push({
                            row:
                                row._previewRow,
                            message:
                                `Duplicate Employee ID ${employeeId} in CSV`
                        });

                    } else {

                        csvEmployeeIds.set(
                            employeeId,
                            row._previewRow
                        );
                    }
                }
            );

            /*
             * Check Employee IDs that already
             * exist in the current database.
             *
             * These are NOT errors because the
             * backend will safely skip them.
             */
            const existingEmployeeIds =
                new Set(
                    (employees || [])
                        .map(
                            (employee) =>
                                employee.employeeId
                                    ?.trim()
                                    .toUpperCase()
                        )
                        .filter(Boolean)
                );

            const duplicateExistingRows =
                normalizedRows.filter(
                    (row) =>
                        row.employeeId &&
                        existingEmployeeIds.has(
                            row.employeeId
                        )
                );

            /*
             * Add duplicate information to
             * the preview as a warning.
             */
            duplicateExistingRows.forEach(
                (row) => {

                    const alreadyHasError =
                        errors.some(
                            (error) =>
                                error.row ===
                                row._previewRow
                        );

                    if (!alreadyHasError) {
                        errors.push({
                            row:
                                row._previewRow,
                            message:
                                `Employee ID ${row.employeeId} already exists and will be skipped`
                        });
                    }
                }
            );

            setImportPreviewRows(
                normalizedRows
            );

            setImportErrors(errors);

            setShowImportPreview(true);

        } catch (error) {

            console.error(
                "CSV Preview Error:",
                error
            );

            toast.error(
                "Failed to read the CSV file"
            );
        }
    };

    /*
     * CONFIRM IMPORT
     */
    const confirmImport = async () => {

        if (
            importPreviewRows.length === 0
        ) {
            toast.error(
                "There is no data to import"
            );
            return;
        }

        /*
         * Separate actual validation errors
         * from existing employee warnings.
         *
         * Existing employees are allowed because
         * backend will skip them.
         */
        const blockingErrors =
            importErrors.filter(
                (error) =>
                    !error.message.includes(
                        "already exists and will be skipped"
                    )
            );

        if (blockingErrors.length > 0) {
            toast.error(
                "Please fix the errors before importing"
            );
            return;
        }

        setImporting(true);

        try {

            const rowsForImport =
                importPreviewRows.map(
                    (row) => {

                        const {
                            _previewRow,
                            ...employee
                        } = row;

                        return {
                            ...employee,
                            employeeId:
                                employee
                                    .employeeId
                                    ?.trim()
                                    .toUpperCase() ||
                                "",
                            name:
                                employee.name
                                    ?.trim() ||
                                "",
                            department:
                                employee
                                    .department
                                    ?.trim() ||
                                "",
                            designation:
                                employee
                                    .designation
                                    ?.trim() ||
                                "",
                            joiningDate:
                                employee
                                    .joiningDate
                                    ?.trim() ||
                                "",
                            salary:
                                employee.salary ===
                                ""
                                    ? ""
                                    : Number(
                                        employee.salary
                                    ),
                            status:
                                employee.status
                                    ?.trim() ||
                                ""
                        };
                    }
                );

            const response =
                await api.post(
                    "/employees/import",
                    {
                        employees:
                            rowsForImport
                    }
                );

            const {
                created = 0,
                skipped = 0,
                failed = []
            } = response.data;

            if (created > 0) {
                toast.success(
                    `Imported ${created} employee(s) successfully`
                );
            }

            if (skipped > 0) {
                toast.info(
                    `${skipped} duplicate employee(s) skipped`
                );
            }

            if (failed.length > 0) {
                toast.error(
                    `${failed.length} row(s) failed — row ${failed[0].row}: ${failed[0].message}`
                );
            }

            setShowImportPreview(false);
            setImportPreviewRows([]);
            setImportErrors([]);

            await loadEmployees();

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to import employees"
            );

        } finally {
            setImporting(false);
        }
    };

    const closeImportPreview = () => {

        if (importing) {
            return;
        }

        setShowImportPreview(false);
        setImportPreviewRows([]);
        setImportErrors([]);
    };

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredEmployees.length /
            employeesPerPage
        )
    );

    const safePage = Math.min(
        currentPage,
        totalPages
    );

    const indexOfLastEmployee =
        safePage * employeesPerPage;

    const indexOfFirstEmployee =
        indexOfLastEmployee -
        employeesPerPage;

    const currentEmployees =
        filteredEmployees.slice(
            indexOfFirstEmployee,
            indexOfLastEmployee
        );

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    const blockingErrors =
        importErrors.filter(
            (error) =>
                !error.message.includes(
                    "already exists and will be skipped"
                )
        );

    return (
        <Layout>

            {/* Header */}
            <div className="page-header">

                <div className="page-title-section">
                    <h1>Employees</h1>
                    <p>
                        Manage employee records
                    </p>
                </div>

                <div className="page-actions">

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        style={{
                            display: "none"
                        }}
                        onChange={
                            handleImportFile
                        }
                    />

                    <button
                        className="btn btn-secondary"
                        onClick={
                            handleExport
                        }
                    >
                        Export CSV
                    </button>

                    <button
                        className={`btn btn-secondary ${
                            importing
                                ? "is-loading"
                                : ""
                        }`}
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                        disabled={importing}
                    >
                        {importing
                            ? "Importing..."
                            : "Import CSV"}
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            navigate(
                                "/add-employee"
                            )
                        }
                    >
                        Add Employee
                    </button>

                </div>

            </div>

            {/* Filters */}
            <div className="filters-row filters-row--plain">

                <div className="filter-field">

                    <label className="form-label">
                        Search
                    </label>

                    <input
                        type="text"
                        className="search-box-sm"
                        placeholder="Name, ID, department..."
                        value={search}
                        onChange={(e) => {
                            setSearch(
                                e.target.value
                            );
                            setCurrentPage(1);
                        }}
                    />

                </div>

                <div className="filter-field">

                    <label className="form-label">
                        Status
                    </label>

                    <select
                        className="filter-select-sm"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(
                                e.target.value
                            );
                            setCurrentPage(1);
                        }}
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Active">
                            Active
                        </option>

                        <option value="Inactive">
                            Inactive
                        </option>
                    </select>

                </div>

            </div>

            <ResultsSummary
                shown={
                    currentEmployees.length
                }
                total={
                    filteredEmployees.length
                }
                label="employees"
            />

            {/* Employee Table */}
            {filteredEmployees.length === 0 ? (

                <div
                    className="card"
                    style={{
                        textAlign: "center",
                        padding:
                            "var(--spacing-16)"
                    }}
                >
                    <p
                        className="text-muted"
                        style={{
                            marginBottom: 0
                        }}
                    >
                        No employees found
                    </p>
                </div>

            ) : (

                <div className="card employees-card">

                    <div className="table-responsive table-responsive-fit">

                        <table
                            className={`employees-table${
                                role === "Admin"
                                    ? " employees-table--admin"
                                    : ""
                            }`}
                        >

                            <thead>
                                <tr>
                                    <th className="col-id">
                                        ID
                                    </th>

                                    <th className="col-name">
                                        Name
                                    </th>

                                    <th className="col-dept">
                                        Department
                                    </th>

                                    <th className="col-desig">
                                        Designation
                                    </th>

                                    <th className="col-date">
                                        Joined
                                    </th>

                                    <th className="col-salary">
                                        Salary
                                    </th>

                                    <th className="col-status col-badge">
                                        Status
                                    </th>

                                    {role ===
                                        "Admin" && (
                                        <th className="col-actions">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>

                                {currentEmployees.map(
                                    (employee) => {

                                        const departmentName =
                                            getDepartmentName(
                                                employee.department
                                            );

                                        const designationName =
                                            getDesignationName(
                                                employee.designation
                                            );

                                        return (
                                            <tr
                                                key={
                                                    employee._id
                                                }
                                            >

                                                <td className="cell-nowrap col-id">
                                                    <strong>
                                                        {
                                                            employee.employeeId
                                                        }
                                                    </strong>
                                                </td>

                                                <td
                                                    className="cell-ellipsis col-name"
                                                    title={
                                                        employee.name
                                                    }
                                                >
                                                    {
                                                        employee.name
                                                    }
                                                </td>

                                                <td className="cell-ellipsis col-dept" title={departmentName || ""}>
    {departmentName || "—"}
</td>

<td className="cell-ellipsis col-desig" title={designationName || ""}>
    {designationName || "—"}
</td>

                                                <td className="cell-nowrap col-date">
                                                    {formatShortDate(
                                                        employee.joiningDate
                                                    )}
                                                </td>

                                                <td className="cell-nowrap col-salary">
                                                    {formatCurrency(
                                                        employee.salary
                                                    )}
                                                </td>

                                                <td className="cell-nowrap col-status cell-badge">
                                                    <StatusBadge
                                                        status={
                                                            employee.status
                                                        }
                                                    />
                                                </td>

                                                {role ===
                                                    "Admin" && (
                                                    <td className="cell-actions col-actions">

                                                        <RowActionsMenu
                                                            ariaLabel={`Actions for ${employee.name}`}
                                                            items={[
                                                                {
                                                                    key: "view",
                                                                    label: "View",
                                                                    onClick:
                                                                        () =>
                                                                            navigate(
                                                                                `/employee/${employee._id}`
                                                                            )
                                                                },
                                                                {
                                                                    key: "edit",
                                                                    label: "Edit",
                                                                    onClick:
                                                                        () =>
                                                                            navigate(
                                                                                `/edit-employee/${employee._id}`
                                                                            )
                                                                },
                                                                {
                                                                    key: "delete",
                                                                    label: "Delete",
                                                                    danger: true,
                                                                    onClick:
                                                                        () =>
                                                                            handleDeleteClick(
                                                                                employee._id,
                                                                                employee.name
                                                                            )
                                                                }
                                                            ]}
                                                        />

                                                    </td>
                                                )}

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* Pagination */}
                    <div className="employees-table-pagination">

                        <button
                            className="btn btn-secondary"
                            disabled={
                                safePage === 1
                            }
                            onClick={() =>
                                setCurrentPage(
                                    safePage - 1
                                )
                            }
                        >
                            Previous
                        </button>

                        <span
                            style={{
                                minWidth:
                                    "120px",
                                textAlign:
                                    "center"
                            }}
                        >
                            Page {safePage} of{" "}
                            {totalPages}
                        </span>

                        <button
                            className="btn btn-secondary"
                            disabled={
                                safePage ===
                                totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    safePage + 1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>

                </div>
            )}

            {/* Import Preview */}
            {showImportPreview && (

                <div className="import-preview-overlay">

                    <div className="import-preview-modal">

                        <div className="import-preview-header">

                            <div>
                                <h2>
                                    Import Employees
                                </h2>

                                <p>
                                    Review the employee
                                    data before
                                    importing.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="import-preview-close"
                                onClick={
                                    closeImportPreview
                                }
                                disabled={
                                    importing
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="import-preview-summary">

                            <div>
                                <strong>
                                    {
                                        importPreviewRows.length
                                    }
                                </strong>

                                <span>
                                    Total Rows
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        blockingErrors.length
                                    }
                                </strong>

                                <span>
                                    Rows With Errors
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        importPreviewRows.length -
                                        blockingErrors.length
                                    }
                                </strong>

                                <span>
                                    Valid Rows
                                </span>
                            </div>

                        </div>

                        {importErrors.length >
                            0 && (

                            <div className="import-preview-errors">

                                <strong>
                                    Review these rows:
                                </strong>

                                <ul>

                                    {importErrors.map(
                                        (
                                            error,
                                            index
                                        ) => (

                                            <li
                                                key={
                                                    index
                                                }
                                            >
                                                Row{" "}
                                                {
                                                    error.row
                                                }
                                                :{" "}
                                                {
                                                    error.message
                                                }
                                            </li>

                                        )
                                    )}

                                </ul>

                            </div>

                        )}

                        <div className="import-preview-table-wrapper">

                            <table className="import-preview-table">

                                <thead>

                                    <tr>
                                        <th>
                                            Row
                                        </th>

                                        <th>
                                            Employee ID
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Department
                                        </th>

                                        <th>
                                            Designation
                                        </th>

                                        <th>
                                            Joining Date
                                        </th>

                                        <th>
                                            Salary
                                        </th>

                                        <th>
                                            Status
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {importPreviewRows.map(
                                        (
                                            employee
                                        ) => {

                                            const rowErrors =
                                                importErrors.filter(
                                                    (
                                                        error
                                                    ) =>
                                                        error.row ===
                                                        employee._previewRow
                                                );

                                            const hasBlockingError =
                                                rowErrors.some(
                                                    (
                                                        error
                                                    ) =>
                                                        !error.message.includes(
                                                            "already exists and will be skipped"
                                                        )
                                                );

                                            const hasExistingWarning =
                                                rowErrors.some(
                                                    (
                                                        error
                                                    ) =>
                                                        error.message.includes(
                                                            "already exists and will be skipped"
                                                        )
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        employee._previewRow
                                                    }
                                                    className={
                                                        hasBlockingError
                                                            ? "import-row-error"
                                                            : hasExistingWarning
                                                                ? "import-row-warning"
                                                                : ""
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            employee._previewRow
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.employeeId ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.name ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.department ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.designation ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.joiningDate ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.salary ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.status ||
                                                            "—"
                                                        }
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <div className="import-preview-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={
                                    closeImportPreview
                                }
                                disabled={
                                    importing
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={
                                    confirmImport
                                }
                                disabled={
                                    importing ||
                                    importPreviewRows.length ===
                                        0 ||
                                    blockingErrors.length >
                                        0
                                }
                            >
                                {importing
                                    ? "Importing..."
                                    : `Confirm Import (${importPreviewRows.length})`}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={
                    deleteConfirm.isOpen
                }
                title="Delete Employee"
                message={`Are you sure you want to delete ${deleteConfirm.employeeName}?`}
                warning="This action cannot be undone."
                confirmText="Delete Employee"
                cancelText="Cancel"
                onConfirm={
                    handleDeleteConfirm
                }
                onCancel={() =>
                    setDeleteConfirm({
                        isOpen: false,
                        employeeId: null,
                        employeeName: ""
                    })
                }
                isLoading={
                    deleteLoading
                }
                isDangerous={true}
            />

        </Layout>
    );
}

export default Employees;