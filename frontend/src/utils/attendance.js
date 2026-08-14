/**
 * Attendance display helpers.
 */
export function formatAttendanceTime(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export function formatAttendanceDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatAttendanceDateTime(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export function toTimeInputValue(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

export function formatWorkingHours(value) {
    if (!value && value !== 0) {
        return "—";
    }

    return `${Number(value).toFixed(2)}h`;
}

export const MAX_TIME_EDITS = 3;
export const EDIT_WINDOW_MINUTES = 30;
