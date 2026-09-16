import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";
import { EmptyState } from "./FormField";

const READ_ONLY_MESSAGE =
    "This public demo is intentionally read-only. You can view and export data, but adding, importing, editing, or deleting records is unavailable.";

function getSafeDestination(pathname) {
    if (pathname.includes("employee")) return "/employees";
    if (pathname.includes("attendance")) return "/attendance";
    if (pathname.includes("user")) return "/users";
    return "/dashboard";
}

function DemoWriteRoute({ children }) {
    const { isDemo } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (isDemo) {
        const destination = getSafeDestination(location.pathname);

        return (
            <Layout>
                <EmptyState
                    title="Demo account is read-only"
                    message={READ_ONLY_MESSAGE}
                    action={() => navigate(destination, { replace: true })}
                    actionText="Return to records"
                />
            </Layout>
        );
    }

    return children;
}

export default DemoWriteRoute;
