/**
 * Detect MongoDB ObjectId strings so unpopulated refs are not shown raw in the UI.
 */
export function isObjectIdString(value) {
    return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}
