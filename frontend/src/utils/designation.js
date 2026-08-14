/**
 * Resolve a designation display name from populated or legacy API values.
 */
import { isObjectIdString } from "./objectId";

export function getDesignationName(designation) {
    if (!designation) {
        return "—";
    }

    if (typeof designation === "string") {
        return isObjectIdString(designation) ? "—" : designation;
    }

    return designation.name || "—";
}

/**
 * Resolve a designation ID for form selects.
 */
export function getDesignationId(designation) {
    if (!designation) {
        return "";
    }

    if (typeof designation === "string") {
        return designation;
    }

    return designation._id || "";
}

/**
 * Build select options from designation records.
 */
export function buildDesignationOptions(designations, { includeInactiveId = null } = {}) {
    const activeDesignations = designations.filter((item) => item.status === "Active");

    const options = activeDesignations.map((item) => ({
        value: item._id,
        label: item.name
    }));

    if (includeInactiveId) {
        const current = designations.find((item) => item._id === includeInactiveId);

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
