import React from 'react';
import { Star, Gift } from 'lucide-react';
import { calculateTier } from '../../utils/tierSystem'; 

export default function LoyaltyCard({ stamps, rewardCount, useRewardOnThisJob, setUseRewardOnThisJob, monthlyDeliveryCount = 0 }) {
    
    // 1. Get current tier info
    const { current } = calculateTier(monthlyDeliveryCount);
    
    // 2. Set Max Stamps dynamically based on Tier (Dirt=10 ... Diamond=5)
    // Fallback to 10 if undefined to prevent crash during loading
    const MAX_STAMPS = current.slotsNeeded || 10; 
    
    const renderStars = () => {
        let starsArr = [];
        for (let i = 0; i < MAX_STAMPS; i++) {
            if (i < stamps) {
                // Full Star (Collected)
                starsArr.push(
                    <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-blue-200 transition-transform hover:scale-110">
                        <Star className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                    </div>
                );
            } else {
                // Empty Star (Needed)
                starsArr.push(
                    <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 border border-gray-200">
                        <Star className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                );
            }
        }
        return starsArr;
    };

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100 shadow-sm mb-6 relative overflow-hidden transition-all duration-500">
            
            {/* Background Decoration - changes color based on tier */}
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none ${current.color}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                        My Loyalty Card
                    </h3>
                    <div className="mt-1">
                        <p className="text-xs text-amber-700 font-medium">
                            <span className={`font-bold uppercase ${current.textColor}`}>{current.name} Tier:</span> Collect <span className="font-bold underline">{MAX_STAMPS} stamps</span> for a free delivery!
                        </p>
                    </div>
                </div>
                
                {/* Reward Toggle */}
                {rewardCount > 0 ? (
                    <div className="flex flex-col items-end">
                         <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center animate-pulse">
                            <Gift className="w-3 h-3 mr-1" />
                            {rewardCount} REWARD{rewardCount > 1 ? 'S' : ''} BANKED!
                        </div>
                        <label className="flex items-center mt-2 cursor-pointer bg-white px-2 py-1.5 rounded border border-green-200 shadow-sm hover:bg-green-50 transition">
                            <span className="text-xs font-bold text-green-700 mr-2">Use Reward?</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={useRewardOnThisJob} onChange={(e) => setUseRewardOnThisJob(e.target.checked)} />
                                <div className={`block w-9 h-5 rounded-full transition-colors ${useRewardOnThisJob ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${useRewardOnThisJob ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                ) : (
                    <div className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
                        No Rewards Yet
                    </div>
                )}
            </div>

            {/* Stars Grid - Centered alignment handles variable star counts gracefully */}
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center mb-3 py-2">
                {renderStars()}
            </div>
            
            <div className="text-center">
                <p className="text-xs text-amber-800/60 font-medium">
                    (You currently have {stamps} / {MAX_STAMPS} stamps.)
                </p>
            </div>
        </div>
    );
}