// src/utils/tierSystem.js

export const TIERS = [
    { 
        id: 'dirt', 
        name: 'Dirt', 
        min: 0, 
        color: 'bg-amber-900', 
        textColor: 'text-amber-900',
        icon: '🟤',
        multiplier: 1.0,
        slotsNeeded: 10, // NEW: Defines visual card size
        reqText: '0-4 Deliveries/Mo',
        perk: '10 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'wood', 
        name: 'Wood', 
        min: 5, 
        color: 'bg-yellow-800', 
        textColor: 'text-yellow-800', 
        icon: '🪵',
        multiplier: 1.12,
        slotsNeeded: 9, // NEW
        reqText: '5-14 Deliveries/Mo',
        perk: '9 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'stone', 
        name: 'Stone', 
        min: 15, 
        color: 'bg-gray-500', 
        textColor: 'text-gray-600', 
        icon: '🪨', 
        multiplier: 1.25,
        slotsNeeded: 8, // NEW
        reqText: '15-29 Deliveries/Mo',
        perk: '8 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'iron', 
        name: 'Iron', 
        min: 30, 
        color: 'bg-slate-400', 
        textColor: 'text-slate-500', 
        icon: '⚔️',
        multiplier: 1.43,
        slotsNeeded: 7, // NEW
        reqText: '30-59 Deliveries/Mo',
        perk: '7 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'gold', 
        name: 'Gold', 
        min: 60, 
        color: 'bg-yellow-400', 
        textColor: 'text-yellow-600', 
        icon: '🥇',
        multiplier: 1.67,
        slotsNeeded: 6, // NEW
        reqText: '60-99 Deliveries/Mo',
        perk: '6 Stamps = 1 Free Delivery' 
    },
    { 
        id: 'diamond', 
        name: 'Diamond', 
        min: 100, 
        color: 'bg-cyan-400', 
        textColor: 'text-cyan-600', 
        icon: '💎',
        multiplier: 2.0,
        slotsNeeded: 5, // NEW
        reqText: '100+ Deliveries/Mo',
        perk: '5 Stamps = 1 Free Delivery!' 
    }
];

export const calculateTier = (monthlyCount) => {
    // Reverse find the highest tier the user qualifies for
    const tier = [...TIERS].reverse().find(t => monthlyCount >= t.min) || TIERS[0];
    
    // Calculate next tier details
    const currentIndex = TIERS.findIndex(t => t.id === tier.id);
    const nextTier = TIERS[currentIndex + 1];
    
    let progress = 100;
    let toNext = 0;

    if (nextTier) {
        const range = nextTier.min - tier.min;
        const currentInTier = monthlyCount - tier.min;
        progress = (currentInTier / range) * 100;
        toNext = nextTier.min - monthlyCount;
    }

    return { 
        current: tier, 
        next: nextTier, 
        progress: Math.min(progress, 100), 
        toNext 
    };
};