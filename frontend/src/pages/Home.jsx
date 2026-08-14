import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";
import "../styles/design-system.css";

function Home() {
    return (
        <div className="home-page">
            <main className="home-main">
                <section className="home-hero">
                    <div className="home-hero-content">
                        <AppLogo className="app-logo app-logo-hero" alt="elog Employee Management System" />

                        <p className="home-hero-tagline">
                            Employee Management System
                        </p>

                        <h1 className="home-hero-title">
                            Manage your workforce with clarity and control
                        </h1>

                        <p className="home-hero-description">
                            elog is a modern platform for HR teams and administrators to
                            manage employees, departments, designations, attendance, and
                            user accounts — all in one secure, organized workspace.
                        </p>

                        <div className="home-hero-actions">
                            <Link to="/login" className="btn btn-primary btn-lg">
                                Sign In to elog
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="home-features">
                    <h2 className="home-section-title">Everything you need to run your team</h2>

                    <div className="home-features-grid">
                        <article className="home-feature-card">
                            <h3>Employee Records</h3>
                            <p>
                                Create, edit, and maintain complete employee profiles with
                                departments, designations, compensation, and status tracking.
                            </p>
                        </article>

                        <article className="home-feature-card">
                            <h3>Department & Designation</h3>
                            <p>
                                Structure your organization with managed departments and
                                role designations linked directly to employee records.
                            </p>
                        </article>

                        <article className="home-feature-card">
                            <h3>Attendance & Users</h3>
                            <p>
                                Track attendance, manage system users, and control access with
                                role-based permissions for admins and employees.
                            </p>
                        </article>
                    </div>
                </section>
            </main>

            <footer className="home-footer">
                <AppLogo className="app-logo app-logo-footer" alt="elog" />
                <p>© {new Date().getFullYear()} elog — Employee Management System</p>
            </footer>
        </div>
    );
}

export default Home;
