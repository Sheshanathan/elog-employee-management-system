const MAX_TIME_EDITS = 3;
const EDIT_WINDOW_MS = 30 * 60 * 1000;

function computeWorkingHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
        return 0;
    }

    const difference = new Date(checkOut).getTime() - new Date(checkIn).getTime();

    if (difference <= 0) {
        return 0;
    }

    return Number((difference / (1000 * 60 * 60)).toFixed(2));
}

function isWithinEditWindow(originalTime, newTime) {
    if (!originalTime || !newTime) {
        return false;
    }

    const difference = Math.abs(
        new Date(newTime).getTime() - new Date(originalTime).getTime()
    );

    return difference <= EDIT_WINDOW_MS;
}

function buildDateTimeOnSameDay(baseDate, timeValue) {
    const day = new Date(baseDate);
    const time = new Date(timeValue);

    day.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return day;
}

function parseTimeOnDate(baseDate, timeValue) {
    if (!timeValue) {
        return null;
    }

    if (/^\d{2}:\d{2}$/.test(timeValue)) {
        const [hours, minutes] = timeValue.split(":").map(Number);
        const day = new Date(baseDate);
        day.setHours(hours, minutes, 0, 0);
        return day;
    }

    return buildDateTimeOnSameDay(baseDate, timeValue);
}

module.exports = {
    MAX_TIME_EDITS,
    EDIT_WINDOW_MS,
    computeWorkingHours,
    isWithinEditWindow,
    buildDateTimeOnSameDay,
    parseTimeOnDate
};
