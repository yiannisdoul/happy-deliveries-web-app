// --- CONFIGURATION ---
const SPEED_KMH = 40; 
const MANDATORY_BUFFER = 30; // Minutes between jobs for travel/rest

/**
 * Calculates the total duration (in minutes) a job occupies.
 */
export const calculateJobDuration = (weightBracket, distance, flights = 0, difficultAccess = false) => {
    // 1. Labor Time & Trips
    let laborMins = 0;
    let trips = 1;

    if (weightBracket === 1) { 
        laborMins = 60; trips = 1; 
    } else if (weightBracket === 2) { 
        laborMins = 120; trips = 2; 
    } else if (weightBracket === 3) { 
        laborMins = 180; trips = 3; 
    } else { 
        return 0; // Special Quote (No time block)
    }

    // 2. Transit Time (Distance / 40km/h * 2 legs per trip)
    const hoursPerLeg = distance / SPEED_KMH;
    const totalLegs = trips * 2;
    const transitMins = Math.round(hoursPerLeg * 60 * totalLegs);

    // 3. Complexity Buffers
    const stairsMins = 15 * flights * trips;
    const accessMins = difficultAccess ? 30 : 0;

    // 4. Total Job Duration + Mandatory Buffer
    return laborMins + transitMins + stairsMins + accessMins + MANDATORY_BUFFER;
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
 * Checks if a specific time slot OR its duration overlaps with any busy interval.
 */
export const isSlotBlocked = (checkMinutes, proposedDuration, busyIntervals) => {
    // If the job is a quote, we don't know the duration, so block nothing by default 
    if (proposedDuration === 0) return false; 

    const proposedEnd = checkMinutes + proposedDuration;

    return busyIntervals.some(interval => {
        // OVERLAP LOGIC: A new job overlaps an existing job IF:
        // Its start time is BEFORE the existing job ends AND
        // Its end time is AFTER the existing job starts.
        return checkMinutes < interval.end && proposedEnd > interval.start;
    });
};