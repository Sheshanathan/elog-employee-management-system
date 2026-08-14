/**
 * Resolve a department display name from populated or legacy API values.
 */
import { isObjectIdString } from "./objectId";

export function getDepartmentName(department) {
    if (!department) {
        return "—";
    }

    if (typeof department === "string") {
        return isObjectIdString(department) ? "—" : department;
    }

    return department.name || "—";
}

/**
 * Resolve a department ID for form selects.
 */
export function getDepartmentId(department) {
    if (!department) {
        return "";
    }

    if (typeof department === "string") {
        return department;
    }

    return department._id || "";
}

/**
 * Build select options from department records.
 */
export function buildDepartmentOptions(departments, { includeInactiveId = null } = {}) {
    const activeDepartments = departments.filter((dept) => dept.status === "Active");

    const options = activeDepartments.map((dept) => ({
        value: dept._id,
        label: dept.name
    }));

    if (includeInactiveId) {
        const current = departments.find((dept) => dept._id === includeInactiveId);

        if (current && current.status !== "Active") {
            const alreadyIncluded = options.some((option) => option.value === current._id);

            if (!alreadyIncluded) {
                options.unshift({
                    value: current._id,
                    label: `${current.name} (Inactive)`
                });
            }
        }
    }

    return options;
}
