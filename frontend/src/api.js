import axios from "axios";
import { clearSession } from "./utils/userDisplay";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || "";
        const requestUrl = error.config?.url || "";

        // Do not redirect authentication pages.
        const isAuthRequest =
            /\/(login|forgot-password|reset-password|validate-reset-token)(\/|$|\?)/.test(
                requestUrl
            );

        /*
         * 401
         * Token missing, invalid or expired.
         */
        if (status === 401 && !isAuthRequest) {
            clearSession();

            window.location.href = "/login?message=session-expired";

            return Promise.reject(error);
        }

        /*
         * 403
         * Account disabled OR employee became inactive.
         */
        if (status === 403 && !isAuthRequest) {
            const lowerMessage = message.toLowerCase();

            const isDisabledAccount =
                lowerMessage.includes("account has been disabled") ||
                lowerMessage.includes("account is disabled");

            const isInactiveEmployee =
                lowerMessage.includes("employee account is inactive") ||
                lowerMessage.includes("employee profile is inactive");

            if (isDisabledAccount || isInactiveEmployee) {
                clearSession();

                /*
                 * Store the exact backend message so Login.jsx
                 * can display it after redirect.
                 */
                sessionStorage.setItem(
                    "loginMessage",
                    message
                );

                window.location.href = "/login";

                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;