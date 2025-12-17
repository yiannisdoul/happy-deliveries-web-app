// --- CONFIGURATION ---

// 1. Base Travel Time (Minutes) based on Distance Index
// 0-25km(45), 25-50(75), 50-75(90), 75-100(105), 100-150(120), 150-200(150), 200+(240)
const BASE_TRAVEL_TIMES = [45, 75, 90, 105, 120, 150, 240];

// 2. Labor Time (Minutes) based on Weight Index
// <1t(30), 1-2t(45), 2-3t(60), 3t+(90)
const LABOR_TIMES = [30, 45, 60, 90];

const TRANSITION_BUFFER = 30; // Minutes between jobs

/**
 * Calculates the total duration (in minutes) a job occupies.
 * @param {number} distIndex - Distance slider index (0-6)
 * @param {number} weightIndex - Weight slider index (0-3)
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string|number} hourStr - Hour (1-12)
 * @param {string} ampm - "AM" or "PM"
 */
export const calculateJobDuration = (distIndex, weightIndex, dateStr, hourStr, ampm) => {
    // 1. Convert Time to 24h for Traffic Logic
    let hour24 = parseInt(hourStr);
    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (ampm === 'AM' && hour24 === 12) hour24 = 0;

    // 2. Determine Day Type
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = (day === 0 || day === 6);

    // 3. Traffic Multiplier
    let trafficMult = 1.1; // Default Mid-Day Weekday
    
    if (isWeekend) {
        trafficMult = 1.0;
    } else {
        // Weekday Logic
        if (hour24 >= 7 && hour24 < 9) trafficMult = 1.5; // Morning Peak
        else if (hour24 >= 15 && hour24 < 18) trafficMult = 1.5; // Afternoon Peak
    }

    // 4. Calculate Component Times
    const baseTime = BASE_TRAVEL_TIMES[distIndex] || 45;
    const laborTime = LABOR_TIMES[weightIndex] || 30;
    
    const travelTimeWithTraffic = Math.round(baseTime * trafficMult);
    
    return travelTimeWithTraffic + laborTime + TRANSITION_BUFFER;
};

/**
 * Converts "10" "30" "AM" to minutes from midnight (e.g. 630)
 */
export const getMinutesFromMidnight = (hour, minute, ampm) => {
    let h = parseInt(hour);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return (h * 60) + parseInt(minute);
};

/**
 * Checks if a specific time slot is inside any busy interval.
 * @param {number} checkMinutes - Time to check (mins from midnight)
 * @param {Array} busyIntervals - [{start: 600, end: 750}, ...]
 */
export const isSlotBlocked = (checkMinutes, busyIntervals) => {
    return busyIntervals.some(interval => 
        checkMinutes >= interval.start && checkMinutes < interval.end
    );
};