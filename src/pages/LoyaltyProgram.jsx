import React from 'react';
import { Maximize, Star, Gift, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoyaltyProgram() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 min-h-screen bg-gray-50">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>
            
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10 border border-gray-100">
                <Maximize className="w-10 h-10 text-yellow-500 mb-4" />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">
                    Happy Deliveries Loyalty Program
                </h1>
                
                <p className="text-lg text-gray-600 mb-8">
                    Our loyalty system is simple: earn stamps for every completed job to unlock <strong>free deliveries</strong>! The number of stamps required depends on your current Tier Status.
                </p>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-blue-700 border-b border-blue-100 pb-2">
                        How It Works
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Process Card 1 */}
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <Star className="w-6 h-6 text-yellow-600 mb-2"/>
                            <h3 className="font-bold text-slate-800">Earn Stamps</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Every successfully delivered job earns you 1 stamp towards your next reward.
                            </p>
                        </div>

                        {/* Process Card 2 */}
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <Gift className="w-6 h-6 text-green-600 mb-2"/>
                            <h3 className="font-bold text-slate-800">Bank Rewards</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Once your card is full (5-10 stamps), the reward is <strong>banked</strong> for future use. You can accumulate multiple banked rewards.
                            </p>
                        </div>

                        {/* Process Card 3 */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Maximize className="w-6 h-6 text-blue-600 mb-2"/>
                            <h3 className="font-bold text-slate-800">Redeem Anytime</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Toggle 'Use Reward' on the booking form to apply your discount. Rewards <strong>never expire</strong>!
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-blue-700 border-b border-blue-100 pb-2 pt-4">
                        Loyalty & Tiers Together
                    </h2>
                    <p className="text-gray-700">
                        The two systems are directly linked:
                        <ul className="list-disc list-inside ml-4 mt-3 space-y-2">
                            <li>Your <strong>Tier Status</strong> (Dirt, Iron, Diamond) determines how many stamps you need to fill your Loyalty Card (from 10 stamps down to 5).</li>
                            <li>This means higher tiers unlock free deliveries <strong>faster</strong> by reducing the goalpost.</li>
                        </ul>
                    </p>
                </div>
            </div>
        </div>
    );
}