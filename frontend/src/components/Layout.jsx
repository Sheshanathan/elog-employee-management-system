import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import "../styles/design-system.css";

function Layout({ children }) {
    const { isDemo } = useAuth();

    return (
        <div className="layout-container layout-container--topnav">
            <div className="layout-navbar">
                <Navbar />
            </div>
            <div className="layout-content layout-content--topnav">
                {isDemo && (
                    <div
                        className="demo-readonly-banner"
                        role="status"
                    >
                        <strong>Demo Admin — read-only access.</strong>
                        <span>
                            You can explore all management screens, but changes are disabled.
                        </span>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

export default Layout;
