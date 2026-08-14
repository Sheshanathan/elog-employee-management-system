import { Link, useNavigate } from "react-router-dom";
import AppLogo from "./AppLogo";
import '../styles/design-system.css';

function Sidebar() {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");

        navigate("/");
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo-link">
                    <AppLogo className="app-logo app-logo-sidebar" />
                </Link>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">{name ? name.charAt(0).toUpperCase() : '?'}</div>
                <div className="user-info">
                    <p className="user-name">{name || 'User'}</p>
                    <p className="user-role">{role || 'Employee'}</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <Link
                    to={role === "Employee" ? "/my-dashboard" : "/dashboard"}
                    className="nav-link"
                >
                    Dashboard
                </Link>

                {role === "Admin" && (
                    <>
                        <div className="nav-section-title">Management</div>
                        <Link to="/employees" className="nav-link">
                            Employees
                        </Link>
                        <Link to="/departments" className="nav-link">
                            Departments
                        </Link>
                        <Link to="/designations" className="nav-link">
                            Designations
                        </Link>

                        <div className="nav-section-title">Operations</div>
                        <Link to="/attendance" className="nav-link">
                            Attendance
                        </Link>
                        <Link to="/users" className="nav-link">
                            Users
                        </Link>

                        <div className="nav-section-title">Actions</div>
                        <Link to="/add-employee" className="nav-link">
                            Add Employee
                        </Link>
                        <Link to="/create-user" className="nav-link">
                            Create User
                        </Link>
                    </>
                )}

                {role === "Employee" && (
                    <>
                        <div className="nav-section-title">My Records</div>
                        <Link to="/attendance" className="nav-link">
                            My Attendance
                        </Link>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button
                    onClick={logout}
                    className="btn btn-danger w-full"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
