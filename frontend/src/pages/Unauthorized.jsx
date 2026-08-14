import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "../utils/auth";

function Unauthorized() {

    const navigate = useNavigate();

    return (
       <div className="center-page">
            <h1>403</h1>

            <h2>Access Denied</h2>

            <p>You don't have permission to access this page.</p>

            <button onClick={() => navigate(getDashboardPath())}>
                Go to Dashboard
            </button>

        </div>
    );
}

export default Unauthorized;