/**
 * Resolve the home dashboard route for the current or given role.
 */
export function getDashboardPath(role = localStorage.getItem("role")) {
    return role === "Employee" ? "/my-dashboard" : "/dashboard";
}
