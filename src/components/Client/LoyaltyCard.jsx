import React from 'react';
import { Star, Heart } from 'lucide-react'; 
import { STAMP_MAX, REWARD_VALUE } from '../../utils/constants';

export default function LoyaltyCard({ stamps, rewardCount, useRewardOnThisJob, setUseRewardOnThisJob }) {
    return (
        <div className={`p-4 rounded-xl mb-5 shadow-lg border-2 ${rewardCount > 0 ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg flex items-center text-gray-800"><Heart className="h-5 w-5 mr-2 text-red-500" /> My Loyalty Card</h4>
                {rewardCount > 0 && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">REWARDS BANKED!</span>}
            </div>
            
            {/* Star display logic uses only current stamps */}
            <div className="flex flex-wrap gap-1 justify-center">
                {[...Array(STAMP_MAX)].map((_, i) => (
                    <div key={i} className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300`} style={{ flexBasis: 'calc(20% - 4px)'}}>
                        <Star className={`h-5 w-5 ${stamps > i ? 'text-blue-500 fill-blue-500' : 'text-gray-400'}`} />
                    </div>
                ))}
            </div>
            
            {/* Display Rewards Banked and Stamps Remaining */}
            <p className={`text-sm mt-3 font-semibold text-center ${rewardCount > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                {rewardCount > 0 
                    ? `${rewardCount} Free Delivery${rewardCount > 1 ? 's' : ''} to claim!` // Display banked rewards
                    : `Deliveries until next reward: ${STAMP_MAX - stamps}`
                }
            </p>
            <p className="text-xs text-gray-400 text-center mt-1 italic">
                (You currently have **{stamps}** stamp{stamps !== 1 ? 's' : ''}.)
            </p>

            {/* REWARD SELECTION TOGGLE */}
            {rewardCount > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <label className="flex items-center justify-center cursor-pointer bg-green-100 p-3 rounded-lg hover:bg-green-200 transition">
                        <input 
                            type="checkbox" 
                            checked={useRewardOnThisJob} 
                            onChange={() => setUseRewardOnThisJob(prev => !prev)} 
                            className="h-5 w-5 text-green-600 rounded mr-3"
                        />
                        <span className="font-bold text-green-800 text-sm">
                            APPLY BANKED FREE DELIVERY (${REWARD_VALUE} Discount)
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
}