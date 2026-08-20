import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AppLogo from "./AppLogo";
import NotificationBell from "./NotificationBell";
import { ConfirmationModal } from "./FormField";
import "../styles/design-system.css";

/**
 * Top navigation bar.
 * Replaces the old vertical Sidebar. Renders role-appropriate links,
 * highlights the active route via NavLink's `isActive`, and shows a
 * user menu (Profile / Logout) with a proper confirmation modal.
 */
function Navbar() {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutConfirm, setLogoutConfirm] = useState(false);

    const doLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        setLogoutConfirm(false);
        navigate("/");
    };

    const linkClass = ({ isActive }) =>
        `topnav-link${isActive ? " active" : ""}`;

    return (
        <nav className="navbar topnav">
            <div className="topnav-container">
                <NavLink to={role === "Employee" ? "/my-dashboard" : "/dashboard"} className="topnav-brand">
                    <AppLogo className="app-logo app-logo-topnav" />
                    <span className="topnav-title">Employee Management</span>
                </NavLink>

                <div className="topnav-links">
                    <NavLink
                        to={role === "Employee" ? "/my-dashboard" : "/dashboard"}
                        end
                        className={linkClass}
                    >
                        Dashboard
                    </NavLink>

                    {role === "Admin" && (
                        <>
                            <NavLink to="/employees" className={linkClass}>Employees</NavLink>
                            <NavLink to="/departments" className={linkClass}>Departments</NavLink>
                            <NavLink to="/designations" className={linkClass}>Designations</NavLink>
                            <NavLink to="/attendance" className={linkClass}>Attendance</NavLink>
                            <NavLink to="/leave-management" className={linkClass}>Leave Management</NavLink>
                            <NavLink to="/users" className={linkClass}>Users</NavLink>
                        </>
                    )}

                    {role === "Employee" && (
                        <>
                            <NavLink to="/attendance" className={linkClass}>My Attendance</NavLink>
                            <NavLink to="/my-leave" className={linkClass}>My Leave</NavLink>
                        </>
                    )}
                </div>

                <div className="topnav-user">
                    <NotificationBell />
                    <button
                        type="button"
                        className="topnav-user-btn"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                    >
                        <span className="user-avatar user-avatar-sm">
                            {name ? name.charAt(0).toUpperCase() : "?"}
                        </span>
                        <span className="topnav-user-info">
                            <span className="topnav-user-name">{name || "User"}</span>
                            <span className="topnav-user-role">{role || "Employee"}</span>
                        </span>
                    </button>

                    {menuOpen && (
                        <div className="topnav-user-menu" role="menu">
                            <button
                                type="button"
                                className="topnav-user-menu-item"
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate("/profile");
                                }}
                            >
                                Profile
                            </button>
                            <button
                                type="button"
                                className="topnav-user-menu-item is-danger"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setLogoutConfirm(true);
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={logoutConfirm}
                title="Confirm Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                cancelText="Cancel"
                onConfirm={doLogout}
                onCancel={() => setLogoutConfirm(false)}
                isDangerous={true}
            />
        </nav>
    );
}

export default Navbar;