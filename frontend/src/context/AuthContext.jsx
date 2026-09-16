import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import {
    clearSession,
    getUserDisplayName,
    persistSession
} from "../utils/userDisplay";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [displayName, setDisplayName] = useState(
        () => localStorage.getItem("name") || ""
    );
    const [role, setRole] = useState(
        () => localStorage.getItem("role") || ""
    );
    const [isDemo, setIsDemo] = useState(
        () => localStorage.getItem("isDemo") === "true"
    );
    const location = useLocation();

    const applyUser = useCallback((user) => {
        if (!user) {
            return;
        }

        const nextName = getUserDisplayName(user);
        const nextRole = user.role || localStorage.getItem("role") || "";
        const nextIsDemo = Boolean(user.isDemo);

        setDisplayName(nextName);
        setRole(nextRole);
        setIsDemo(nextIsDemo);

        persistSession({
            role: nextRole,
            name: nextName,
            isDemo: nextIsDemo
        });
    }, []);

    const refreshSession = useCallback(async () => {
        const token = localStorage.getItem("token");
        const path = window.location.pathname;
        const isPublicPage =
            path === "/" ||
            path === "/login" ||
            path.startsWith("/forgot-password") ||
            path.startsWith("/reset-password") ||
            path === "/unauthorized";

        if (!token) {
            setDisplayName("");
            setRole("");
            setIsDemo(false);
            return;
        }

        if (isPublicPage) {
            return;
        }

        try {
            const response = await api.get("/users/my/profile");
            applyUser(response.data);
        } catch {
            /*
             * Keep the cached label if the profile request fails
             * (for example a transient network error).
             */
        }
    }, [applyUser]);

    const login = useCallback((session) => {
        persistSession({
            token: session.token,
            role: session.role,
            name: session.name || "",
            isDemo: Boolean(session.isDemo)
        });

        setDisplayName(session.name || "");
        setRole(session.role || "");
        setIsDemo(Boolean(session.isDemo));
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setDisplayName("");
        setRole("");
        setIsDemo(false);
    }, []);

    useEffect(() => {
        refreshSession();
    }, [location.pathname, refreshSession]);

    useEffect(() => {
        const onFocus = () => {
            refreshSession();
        };

        window.addEventListener("focus", onFocus);

        return () => {
            window.removeEventListener("focus", onFocus);
        };
    }, [refreshSession]);

    const value = useMemo(
        () => ({
            displayName,
            role,
            isDemo,
            applyUser,
            refreshSession,
            login,
            logout
        }),
        [displayName, role, isDemo, applyUser, refreshSession, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        return {
            displayName: localStorage.getItem("name") || "",
            role: localStorage.getItem("role") || "",
            isDemo: localStorage.getItem("isDemo") === "true",
            applyUser: () => {},
            refreshSession: async () => {},
            login: () => {},
            logout: clearSession
        };
    }

    return context;
}
