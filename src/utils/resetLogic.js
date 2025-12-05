// src/utils/resetLogic.js
import { TIERS, ROLLOVER_CAP, getTierByCount } from './tierSystem';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase'; 

// --- TEMPORARY DEBUG FLAG ---
// Must be TRUE to execute the forced reset below
const FORCE_DEBUG_RESET = false; 
// -----------------------------

/**
 * Checks if a monthly reset is needed and performs it.
 * @param {object} user - The user object from Firestore 
 */
export const checkAndPerformReset = async (user) => {
    if (!user || !user.uid) return;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    let needsReset = false;

    // --- NORMAL MONTHLY CHECK ---
    let lastResetKey = "";
    if (user.last_reset_date) {
        const dateObj = user.last_reset_date.toDate ? user.last_reset_date.toDate() : new Date(user.last_reset_date);
        lastResetKey = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;
    }
    if (currentMonthKey !== lastResetKey) {
        needsReset = true;
    }
    
    // --- DEBUG OVERRIDE ---
    if (FORCE_DEBUG_RESET) {
        needsReset = true;
        console.warn("DEBUG MODE: FORCING MONTHLY RESET LOGIC TO RUN.");
    }
    // -------------------------
    
    if (needsReset) {
        console.log("Performing Monthly Rollover for:", user.uid);
        
        let currentTotal = user.monthly_delivery_count || 0;

        // --- HARDCODED TEST OVERRIDE ---
        // We override the DB value to guarantee the 72->22 test math runs.
        // REMOVE THIS BLOCK AFTER SUCCESSFUL TEST!
        if (FORCE_DEBUG_RESET) {
            currentTotal = 72;
            console.warn(`TEST OVERRIDE: Using hardcoded total of ${currentTotal}.`);
        }
        // -------------------------------
        
        // 1. Identify Tier Floor (Iron, Floor 50)
        const achievedTier = getTierByCount(currentTotal);
        
        // 2. Calculate Surplus (72 - 50 = 22)
        const rawRollover = currentTotal - achievedTier.floor;
        
        // 3. Apply Cap (Max 49)
        const sanitizedRollover = Math.max(0, rawRollover); 
        const nextMonthStartCount = Math.min(sanitizedRollover, ROLLOVER_CAP);

        // 4. Update Firestore
        const userRef = doc(db, "users", user.uid);
        
        try {
            await updateDoc(userRef, {
                monthly_delivery_count: nextMonthStartCount, 
                last_month_total: currentTotal,              
                last_month_tier: achievedTier.name,          
                last_reset_date: serverTimestamp()           
            });
            console.log(`Reset Complete. Old: ${currentTotal}, New: ${nextMonthStartCount}`);
            
            // REMEMBER: Manually set FORCE_DEBUG_RESET back to false after confirmation!
        } catch (error) {
            console.error("Error performing reset:", error);
        }
    }
};