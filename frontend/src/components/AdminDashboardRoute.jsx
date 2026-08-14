import { Navigate } from "react-router-dom";
import { getDashboardPath } from "../utils/auth";

function AdminDashboardRoute({ children }) {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (role === "Employee") {
        return <Navigate to="/my-dashboard" replace />;
    }

    if (role !== "Admin") {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}

export default AdminDashboardRoute;
