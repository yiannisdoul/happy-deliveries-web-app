// src/utils/pricingAlgorithm.js

import { VEHICLES, CHARGES, DISTANCE_RATES } from './constants';

/**
 * 1. Select Best Vehicle
 * Iterates through the fleet to find the smallest vehicle that fits the load.
 * Returns null if the load exceeds the largest vehicle (Trigger #2).
 */
export const selectBestVehicle = (volume, weight) => {
    // Fleet sorted by baseCharge (cheapest first) - Hilux -> Vito -> Hiace -> Trailer
    const fleet = [VEHICLES.hilux, VEHICLES.vito, VEHICLES.hiace, VEHICLES.trailer];
    
    for (const vehicle of fleet) {
        if (volume <= vehicle.capacityVol && weight <= vehicle.capacityWeight) {
            return vehicle;
        }
    }
    return null; // Load too big for any single vehicle
};

/**
 * 2. Calculate Distance Charge (d)
 * Applies the tiered multipliers (1.25x for 50-100km, 1.50x for 100-200km).
 */
export const calculateDistanceCharge = (km) => {
    if (km <= 0) return 0;
    
    let charge = 0;
    const baseRate = DISTANCE_RATES.base;

    // Tier 0: 0 - 50km (Base Rate)
    const tier0_km = Math.min(km, 50);
    charge += tier0_km * baseRate;

    // Tier 1: 50 - 100km (1.25x Multiplier)
    if (km > 50) {
        const tier1_km = Math.min(km - 50, 50); 
        charge += tier1_km * (baseRate * DISTANCE_RATES.tier1_multiplier);
    }

    // Tier 2: 100 - 200km (1.50x Multiplier)
    if (km > 100) {
        const tier2_km = Math.min(km - 100, 100);
        charge += tier2_km * (baseRate * DISTANCE_RATES.tier2_multiplier);
    }

    return charge;
};

/**
 * 3. Main Calculation Function
 * returns { status, price, vehicle, reason, breakdown }
 */
export const calculateQuote = (distanceKm, volume, weight, flags = {}) => {
    
    // --- NEGOTIATION TRIGGERS ---

    // Trigger #1: Distance > 200km
    if (distanceKm > 200) {
        return { status: 'NEGOTIATING', reason: 'Long distance (200km+) requires manual quote.' };
    }

    // Trigger #4: Specialized Handling
    if (flags.specializedHandling) {
        return { status: 'NEGOTIATING', reason: 'Specialized handling required.' };
    }

    // Trigger #5: Multiple People (Extra Help)
    // If the user flagged "Extra Help" (more than just driver assistance), we negotiate.
    // For this MVP, we assume 'requiresHelp' is standard driver assist (+$ fee), 
    // but if you add an 'extraPerson' flag later, check it here.
    
    // --- VEHICLE SELECTION ---
    const vehicle = selectBestVehicle(volume, weight);

    // Trigger #2: Capacity Exceeded
    if (!vehicle) {
        return { status: 'NEGOTIATING', reason: 'Load exceeds single vehicle capacity. Multiple trips/vehicles needed.' };
    }

    // Trigger #3: Trailer Required
    if (vehicle.id === 'trailer') {
        return { status: 'NEGOTIATING', reason: 'Trailer transport requires manual logistics planning.' };
    }

    // --- PRICE CALCULATION ($ = m + d + v) ---
    
    // m = Minimum Charge (Base Charge for Vehicle)
    const m = vehicle.baseCharge; 

    // d = Distance Charge
    const d = calculateDistanceCharge(distanceKm); 
    
    // v = Variable Charge (Size + Weight)
    const s = volume * CHARGES.sizeRate;
    const w = weight * CHARGES.weightRate;
    const v = s + w;

    let finalPrice = m + d + v;

    // Add Standard Assistance Fee (if standard driver help is requested)
    // This is distinct from "Specialized Handling" which triggers negotiation.
    if (flags.requiresHelp) {
        finalPrice += CHARGES.assistFee; 
    }

    return { 
        status: 'QUOTE', 
        price: Math.ceil(finalPrice), // Round up to nearest dollar
        vehicle: vehicle.name,
        breakdown: { 
            base: m, 
            distance: d, 
            variable: v, 
            extras: flags.requiresHelp ? CHARGES.assistFee : 0 
        }
    };
};