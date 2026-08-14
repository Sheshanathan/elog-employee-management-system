import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ConfirmationModal,
    LoadingSpinner,
    ResultsSummary,
    RoleBadge,
    RowActionsMenu,
    StatusBadge,
} from "../components/FormField";
import { matchesSearch } from "../utils/search";
import '../styles/design-system.css';

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, userId: null, userName: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const usersPerPage = 10;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get("/users");
            setUsers(response.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (userId, userName) => {
        setDeleteConfirm({
            isOpen: true,
            userId,
            userName
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.userId) return;

        setDeleteLoading(true);
        try {
            await api.delete(`/users/${deleteConfirm.userId}`);
            toast.success("User deleted successfully");
            setUsers(prev => prev.filter(u => u._id !== deleteConfirm.userId));
            setDeleteConfirm({ isOpen: false, userId: null, userName: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredUsers = (users || []).filter((user) =>
        matchesSearch(search, user.name, user.email, user.role)
    );

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const indexOfLastUser = safePage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-header">
                <div className="page-title-section">
                    <h1>Users</h1>
                    <p>Manage system login accounts</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => navigate("/create-user")}>
                        Create User
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="filters-row">
                    <div className="filter-field">
                        <label className="form-label">Search Users</label>
                        <input
                            type="text"
                            className="search-box-sm"
                            placeholder="By name or email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            <ResultsSummary
                shown={currentUsers.length}
                total={filteredUsers.length}
                label="users"
            />

            {filteredUsers.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-16)' }}>
                    <p className="text-muted" style={{ marginBottom: 0 }}>No users found</p>
                </div>
            ) : (
                <div className="card app-table-card">
                    <div className="table-responsive table-responsive-fit">
                        <table className="app-data-table users-table">
                            <thead>
                                <tr>
                                    <th className="col-name cell-text">Name</th>
                                    <th className="col-email cell-text">Email</th>
                                    <th className="col-role col-badge">Role</th>
                                    <th className="col-status col-badge">Status</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user) => (
                                    <tr key={user._id}>
                                        <td className="col-name cell-ellipsis cell-text" title={user.name}>
                                            <strong>{user.name}</strong>
                                        </td>
                                        <td className="col-email cell-ellipsis cell-text" title={user.email}>
                                            {user.email}
                                        </td>
                                        <td className="col-role cell-badge">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="col-status cell-badge">
                                            <StatusBadge status={user.isActive ? "Active" : "Inactive"} />
                                        </td>
                                        <td className="col-actions cell-actions">
                                            <RowActionsMenu
                                                ariaLabel={`Actions for ${user.name}`}
                                                items={[
                                                    {
                                                        key: 'edit',
                                                        label: 'Edit',
                                                        onClick: () => navigate(`/edit-user/${user._id}`),
                                                    },
                                                    {
                                                        key: 'delete',
                                                        label: 'Delete',
                                                        danger: true,
                                                        onClick: () => handleDeleteClick(user._id, user.name),
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="app-table-pagination">
                        <button
                            className="btn btn-secondary"
                            disabled={safePage === 1}
                            onClick={() => setCurrentPage(safePage - 1)}
                        >
                            Previous
                        </button>
                        <span style={{ minWidth: '120px', textAlign: 'center' }}>
                            Page {safePage} of {totalPages}
                        </span>
                        <button
                            className="btn btn-secondary"
                            disabled={safePage === totalPages}
                            onClick={() => setCurrentPage(safePage + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                title="Delete User"
                message={`Are you sure you want to delete ${deleteConfirm.userName}?`}
                warning="This action cannot be undone."
                confirmText="Delete User"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, userId: null, userName: '' })}
                isLoading={deleteLoading}
                isDangerous={true}
            />
        </Layout>
    );
}

export default Users;