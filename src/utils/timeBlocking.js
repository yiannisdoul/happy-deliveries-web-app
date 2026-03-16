// --- CONFIGURATION ---

const TRANSITION_BUFFER = 30; // Minutes between jobs

/**
 * Calculates the total duration (in minutes) a job occupies.
 * @param {number} distance - Actual distance in km
 * @param {number} weight - Actual weight in tonnes
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string|number} hourStr - Hour (1-12)
 * @param {string} ampm - "AM" or "PM"
 */
export const calculateJobDuration = (distance, weight, dateStr, hourStr, ampm) => {
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

    // 4. Calculate Component Times based on actual numbers
    let baseTime = 45; // Default 0-25km
    if (distance > 200) baseTime = 240;
    else if (distance > 150) baseTime = 150;
    else if (distance > 100) baseTime = 120;
    else if (distance > 75) baseTime = 105;
    else if (distance > 50) baseTime = 90;
    else if (distance > 25) baseTime = 75;

    let laborTime = 30; // Default <1t
    if (weight > 3) laborTime = 90;
    else if (weight > 2) laborTime = 60;
    else if (weight > 1) laborTime = 45;
    
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