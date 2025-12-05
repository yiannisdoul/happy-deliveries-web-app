// src/utils/tierSystem.js

export const ROLLOVER_CAP = 49; // The maximum amount a user can carry over (Top of Stone Tier)

export const TIERS = [
    { 
        id: 'dirt', 
        name: 'Dirt', 
        floor: 0, // Lower bound
        ceiling: 9, // Upper bound
        color: 'bg-amber-900', 
        textColor: 'text-amber-900',
        icon: '🟤',
        slotsNeeded: 10, // 10 Stamps = 1 Free
        reqText: '0 - 9 Deliveries',
        perk: '10 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'wood', 
        name: 'Wood', 
        floor: 10, 
        ceiling: 24,
        color: 'bg-yellow-800', 
        textColor: 'text-yellow-800', 
        icon: '🪵',
        slotsNeeded: 9, // 9 Stamps = 1 Free
        reqText: '10 - 24 Deliveries',
        perk: '9 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'stone', 
        name: 'Stone', 
        floor: 25, 
        ceiling: 49,
        color: 'bg-gray-500', 
        textColor: 'text-gray-600', 
        icon: '🪨', 
        slotsNeeded: 8, // 8 Stamps = 1 Free
        reqText: '25 - 49 Deliveries',
        perk: '8 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'iron', 
        name: 'Iron', 
        floor: 50, 
        ceiling: 79,
        color: 'bg-slate-400', 
        textColor: 'text-slate-500', 
        icon: '⚔️',
        slotsNeeded: 7, // 7 Stamps = 1 Free
        reqText: '50 - 79 Deliveries',
        perk: '7 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'gold', 
        name: 'Gold', 
        floor: 80, 
        ceiling: 119,
        color: 'bg-yellow-400', 
        textColor: 'text-yellow-600', 
        icon: '🥇',
        slotsNeeded: 6, // 6 Stamps = 1 Free
        reqText: '80 - 119 Deliveries',
        perk: '6 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'diamond', 
        name: 'Diamond', 
        floor: 120, 
        ceiling: 99999, // Infinite
        color: 'bg-cyan-400', 
        textColor: 'text-cyan-600', 
        icon: '💎',
        slotsNeeded: 5, // 5 Stamps = 1 Free
        reqText: '120+ Deliveries',
        perk: '5 Stamps = 1 Free Delivery!' 
    }
];

// Helper to find which tier a count belongs to
export const getTierByCount = (count) => {
    // Find the tier where count is >= floor and <= ceiling (if defined) or just logic check
    // Since we ordered them low to high, we can find the last one that fits, or just find based on floor.
    // Easier approach with reverse search:
    return [...TIERS].reverse().find(t => count >= t.floor) || TIERS[0];
};

export const calculateTier = (monthlyCount) => {
    const tier = getTierByCount(monthlyCount);
    
    // Find next tier
    const currentIndex = TIERS.findIndex(t => t.id === tier.id);
    const nextTier = TIERS[currentIndex + 1];
    
    let progress = 100;
    let toNext = 0;

    if (nextTier) {
        const range = nextTier.floor - tier.floor;
        const currentInTier = monthlyCount - tier.floor;
        progress = (currentInTier / range) * 100;
        toNext = nextTier.floor - monthlyCount;
    }

    return { 
        current: tier, 
        next: nextTier, 
        progress: Math.min(progress, 100), 
        toNext 
    };
};