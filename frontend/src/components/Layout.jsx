import Navbar from "./Navbar";
import "../styles/design-system.css";

function Layout({ children }) {
    return (
        <div className="layout-container layout-container--topnav">
            <div className="layout-navbar">
                <Navbar />
            </div>
            <div className="layout-content layout-content--topnav">
                {children}
            </div>
        </div>
    );
}

export default Layout;