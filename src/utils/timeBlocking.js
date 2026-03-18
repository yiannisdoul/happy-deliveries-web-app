/**
 * Dynamically calculates transit speed based on distance
 */
const getTransitMins = (distance) => {
    let speed = 40; // Inner city / Short trips
    if (distance > 25 && distance <= 75) speed = 60; // Arterial roads
    else if (distance > 75) speed = 80; // Highway / Long haul
    
    return Math.round((distance / speed) * 60);
};

/**
 * Calculates the exact ROUND-TRIP breakdown of a job relative to the Arrival Deadline.
 */
export const getJobProfile = (weightBracket, distance, flights = 0, difficultAccess = false) => {
    let trips = 1;
    if (weightBracket === 1) trips = 1;
    else if (weightBracket === 2) trips = 2;
    else if (weightBracket === 3) trips = 3;
    else return null; // Special Quote

    const transitMins = getTransitMins(distance);
    const stairMinsPerTrip = 15 * flights;
    const diffAccessMins = difficultAccess ? 30 : 0; 

    // 1. BACKWARD CALCULATION (Pre-Arrival Block - The Outbound Leg)
    // Base Prep (30m) + Stairs + Difficult Access + Drive Out (transitMins)
    const preArrivalMins = 30 + stairMinsPerTrip + diffAccessMins + transitMins;

    // 2. FORWARD CALCULATION (Post-Arrival Completion - The Return Leg)
    // Unload (20m) + Drive Back (transitMins) + Return Buffer/Delay (30m)
    let postArrivalMins = 20 + transitMins + 30;

    // Additional Trips (Load -> Drive Out -> Unload -> Drive Back -> Return Buffer)
    const remainingTrips = trips - 1;
    if (remainingTrips > 0) {
        const singleCycleMins = 30 + stairMinsPerTrip + transitMins + 20 + transitMins + 30;
        postArrivalMins += (remainingTrips * singleCycleMins);
    }

    return {
        preArrivalMins,
        postArrivalMins,
        totalDuration: preArrivalMins + postArrivalMins,
        trips
    };
};

/**
 * Converts "10" "30" "AM" to minutes from midnight
 */
export const getMinutesFromMidnight = (hour, minute, ampm) => {
    let h = parseInt(hour);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return (h * 60) + parseInt(minute);
};

/**
 * Validates a slot strictly against overlaps with existing bookings.
 */
export const checkSlotStatus = (arrivalTimeMins, jobProfile, busyIntervals) => {
    if (!jobProfile) return { isBlocked: false, reason: 'available' }; 

    const startTime = arrivalTimeMins - jobProfile.preArrivalMins;
    const endTime = arrivalTimeMins + jobProfile.postArrivalMins;

    // Overlap Validation Only
    const hasOverlap = busyIntervals.some(interval => {
        return startTime < interval.end && endTime > interval.start;
    });

    if (hasOverlap) {
        return { isBlocked: true, reason: 'overlap' };
    }

    return { isBlocked: false, reason: 'available' };
};