import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import '../styles/design-system.css';

function Layout({ children }) {

    return (
        <div className="layout-container">
            <Sidebar />
            <div className="layout-main">
                <div className="layout-navbar">
                    <Navbar />
                </div>
                <div className="layout-content">
                    {children}
                </div>
            </div>
        </div>
    );

}
export default Layout;