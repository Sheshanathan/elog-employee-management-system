export function normalizeText(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).toLowerCase();
}

export function matchesSearch(query, ...fields) {
    const normalizedQuery = normalizeText(query).trim();

    if (!normalizedQuery) {
        return true;
    }

    return fields.some((field) =>
        normalizeText(field).includes(normalizedQuery)
    );
}
