/**
 * Employee display names come from the linked Employee record. Admin display
 * names come from the User record. `displayName` is provided by the API for
 * consumers that do not need the full relationship.
 */
export function getUserDisplayName(user) {
    if (!user) {
        return "";
    }

    if (user.employee && typeof user.employee === "object" && user.employee.name) {
        return user.employee.name;
    }

    if (user.displayName) {
        return user.displayName;
    }

    if (user.name) {
        return user.name;
    }

    return user.email || "";
}

export function persistSession({ token, role, name }) {
    if (token) {
        localStorage.setItem("token", token);
    }

    if (role) {
        localStorage.setItem("role", role);
    }

    if (name) {
        localStorage.setItem("name", name);
    } else {
        localStorage.removeItem("name");
    }
}

export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
}
