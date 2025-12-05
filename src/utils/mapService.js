// src/utils/mapService.js

// Mock function to simulate an API call to a routing engine (OSRM/Google)
// Returns a distance based on the input string length to allow testing different tiers
export const getRouteDetails = async (pickup, dropoff) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    let distance = 25; // Default short trip

    // Simple keywords to test your algorithm triggers
    const p = pickup.toLowerCase();
    const d = dropoff.toLowerCase();

    if (p.includes('long') || d.includes('long')) distance = 220; // Trigger > 200km
    else if (p.includes('med') || d.includes('med')) distance = 80; // Tier 1 (50-100km)
    else if (p.includes('far') || d.includes('far')) distance = 150; // Tier 2 (100-200km)

    return { distanceKm: distance };
};