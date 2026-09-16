import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DemoWriteRoute({ children }) {
    const { isDemo } = useAuth();

    if (isDemo) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default DemoWriteRoute;
