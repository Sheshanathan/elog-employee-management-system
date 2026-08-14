import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "../utils/auth";

function NotFound() {
     const navigate = useNavigate();
    return (
       <div className="center-page">
            <h1>404</h1>

            <h2>Page Not Found</h2>

            <p>
                The page you are looking for does not exist.
            </p>

            <button onClick={() => navigate(getDashboardPath())}>
                Go to Dashboard
            </button>
        </div>
    );
}

export default NotFound;