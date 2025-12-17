// BASELINE: 50-75km @ Up to 1 tonne = $160
const BASE_PRICE = 160;

export const DISTANCE_OPTIONS = [
    { label: "Up to 25 km", value: 0, multiplier: 0.5 },   // $160 * 0.5 = $80
    { label: "25 - 50 km", value: 1, multiplier: 0.75 },  // $160 * 0.75 = $120
    { label: "50 - 75 km", value: 2, multiplier: 1.0 },   // $160 * 1.0 = $160 (Control)
    { label: "75 - 100 km", value: 3, multiplier: 1.25 }, // $160 * 1.25 = $200
    { label: "100 - 150 km", value: 4, multiplier: 1.55 }, // ~$248 -> Rounds to $250
    { label: "150 - 200 km", value: 5, multiplier: 1.9 },  // ~$304 -> Rounds to $305
    { label: "200 km +", value: 6, isQuote: true }         // Special Quote
];

export const WEIGHT_OPTIONS = [
    { label: "Up to 1 tonne", value: 0, multiplier: 1.0 }, // Control
    { label: "1 - 2 tonnes", value: 1, multiplier: 1.4 },  // +40%
    { label: "2 - 3 tonnes", value: 2, multiplier: 1.8 },  // +80%
    { label: "3 tonnes +", value: 3, isQuote: true }       // Special Quote
];

/**
 * Calculates the price based on distance and weight indices.
 * Rounds the final result to the nearest multiple of 5 (e.g., 130 or 135).
 * Returns { price: number | null, isQuote: boolean }
 */
export const calculatePrice = (distIndex, weightIndex) => {
    const dist = DISTANCE_OPTIONS[distIndex] || DISTANCE_OPTIONS[0];
    const weight = WEIGHT_OPTIONS[weightIndex] || WEIGHT_OPTIONS[0];

    // Check for "Special Quote" conditions
    if (dist.isQuote || weight.isQuote) {
        return { price: 0, isQuote: true };
    }

    // Calculation: Base * DistMult * WeightMult
    const rawPrice = BASE_PRICE * dist.multiplier * weight.multiplier;
    
    // ROUNDING LOGIC:
    // 1. Divide by 5 (e.g., 132 / 5 = 26.4)
    // 2. Round to nearest integer (26.4 -> 26)
    // 3. Multiply by 5 (26 * 5 = 130)
    const roundedPrice = Math.round(rawPrice / 5) * 5;

    return { price: roundedPrice, isQuote: false };
};