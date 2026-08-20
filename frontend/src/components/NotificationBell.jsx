import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import "../styles/design-system.css";

function formatNotificationTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    const now = new Date();
    const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    if (sameDay) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
    });
}

function NotificationBell() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const panelRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await api.get("/notifications/unread-count");
            setUnreadCount(response.data?.count || 0);
        } catch {
            // Silent fail for badge polling
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/notifications?limit=20");
            setNotifications(response.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        const intervalId = window.setInterval(fetchUnreadCount, 30000);
        return () => window.clearInterval(intervalId);
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        fetchNotifications();

        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, fetchNotifications]);

    async function handleMarkAllRead() {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((previous) =>
                previous.map((item) => ({ ...item, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark notifications as read");
        }
    }

    async function handleNotificationClick(notification) {
        try {
            if (!notification.isRead) {
                await api.patch(`/notifications/${notification._id}/read`);
                setUnreadCount((count) => Math.max(0, count - 1));
                setNotifications((previous) =>
                    previous.map((item) =>
                        item._id === notification._id
                            ? { ...item, isRead: true }
                            : item
                    )
                );
            }

            if (
                notification.relatedEntityType === "Leave" &&
                notification.relatedEntityId
            ) {
                const leavePath =
                    role === "Admin"
                        ? `/leave-management?leaveId=${notification.relatedEntityId}`
                        : `/my-leave?leaveId=${notification.relatedEntityId}`;

                setOpen(false);
                navigate(leavePath);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to open notification");
        }
    }

    return (
        <div className="notification-bell" ref={panelRef}>
            <button
                type="button"
                className="notification-bell-btn"
                aria-label="Notifications"
                aria-expanded={open}
                onClick={() => setOpen((previous) => !previous)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M13.73 21a2 2 0 01-3.46 0"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-bell-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="notification-panel" role="menu">
                    <div className="notification-panel-header">
                        <strong>Notifications</strong>
                        {notifications.some((item) => !item.isRead) && (
                            <button
                                type="button"
                                className="notification-mark-all"
                                onClick={handleMarkAllRead}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-panel-body">
                        {loading ? (
                            <p className="notification-empty">Loading notifications...</p>
                        ) : notifications.length === 0 ? (
                            <p className="notification-empty">No notifications yet.</p>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification._id}
                                    type="button"
                                    className={`notification-item${notification.isRead ? "" : " is-unread"}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <span className="notification-item-title">{notification.title}</span>
                                    <span className="notification-item-message">{notification.message}</span>
                                    <span className="notification-item-time">
                                        {formatNotificationTime(notification.createdAt)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
