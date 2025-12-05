// Constants shared across components
export const STAMP_MAX = 10;
export const REWARD_VALUE = 160; // UPDATED DISCOUNT VALUE

// Cloudinary Constants (for OwnerDash/DeliveryModal, kept here for consistency)
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Utility functions for Owner notifications
export const getNotificationMessage = (job) => {
    if (job.status === 'accepted' && job.hasUnreadEdit) {
        return 'CLIENT ACCEPTED YOUR PROPOSAL';
    }
    if (job.status === 'pending' && job.hasUnreadEdit && job.hasClientCountered) {
        return 'CLIENT SUBMITTED COUNTER-OFFER';
    }
    if (job.status === 'pending' && job.hasUnreadEdit) {
        return 'CLIENT EDITED REQUEST';
    }
    if (job.status === 'rejected' && job.hasUnreadEdit) { 
        return 'CLIENT RE-EDITED REJECTED REQUEST';
    }
    return 'MODIFIED BY CLIENT';
};

// --- PRICING ALGORITHM CONSTANTS ---

// Vehicle Fleet Specs
export const VEHICLES = {
    hilux: {
        id: 'hilux',
        name: 'Toyota Hilux',
        capacityVol: 1.5,    // m3
        capacityWeight: 750, // kg
        baseCharge: 120      // $ (m)
    },
    vito: {
        id: 'vito',
        name: 'Mercedes Vito',
        capacityVol: 5.0,
        capacityWeight: 1000,
        baseCharge: 140
    },
    hiace: {
        id: 'hiace',
        name: 'Toyota Hiace',
        capacityVol: 6.0,
        capacityWeight: 1200,
        baseCharge: 160      // Baseline
    },
    trailer: {
        id: 'trailer',
        name: 'Car Trailer',
        capacityVol: 10.0,
        capacityWeight: 3000,
        baseCharge: 250
    }
};

// Distance Multipliers
export const DISTANCE_RATES = {
    base: 2.0,             // $/km for 0-50km
    tier1_multiplier: 1.25, // 50-100km
    tier2_multiplier: 1.50  // 100-200km
};

// Variable Charges
export const CHARGES = {
    sizeRate: 15,     // $ per m3 (s)
    weightRate: 0.10, // $ per kg ($100 per tonne) (w)
    assistFee: 50     // $ Flat fee for driver help
};