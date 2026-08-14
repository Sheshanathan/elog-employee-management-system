/**
 * Format amounts in Indian Rupees.
 */
export function formatCurrency(amount) {
    const value = Number(amount);

    if (Number.isNaN(value)) {
        return "₹0";
    }

    return `₹${value.toLocaleString("en-IN")}`;
}
