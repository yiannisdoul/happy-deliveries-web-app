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
                    Free Deliveries (Loyalty Card)
                </h1>
                
                <p className="text-lg text-gray-600 mb-8">
                    It's just like a coffee card. Fill it up with stamps, and get a free one!
                </p>

                <div className="space-y-8">
                    
                    {/* STEPS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Star className="w-6 h-6 text-yellow-500"/>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">1. Get Stamps</h3>
                            <p className="text-sm text-gray-600">Finish a delivery → Get 1 Stamp.</p>
                        </div>

                        <div className="p-5 bg-green-50 rounded-xl border border-green-100 text-center">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Gift className="w-6 h-6 text-green-600"/>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">2. Fill the Card</h3>
                            <p className="text-sm text-gray-600">When card is full, you get a "Banked Reward".</p>
                        </div>

                        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 text-center">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Maximize className="w-6 h-6 text-blue-600"/>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">3. Use It</h3>
                            <p className="text-sm text-gray-600">Toggle "Use Reward" on your next booking to get it free!</p>
                        </div>
                    </div>

                    {/* CONNECTION TO TIERS */}
                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-3 border-b border-slate-600 pb-2">
                            How do Tiers help?
                        </h2>
                        <p className="text-slate-300 mb-4">
                            Your <strong>Tier Level</strong> decides how big your card is.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-700 p-3 rounded-lg flex items-center">
                                <span className="text-2xl mr-3">🟤</span>
                                <div>
                                    <p className="font-bold text-amber-500">Dirt Tier</p>
                                    <p className="text-xs text-slate-400">Needs 10 Stamps for freebie</p>
                                </div>
                            </div>
                            <div className="bg-slate-700 p-3 rounded-lg flex items-center border border-cyan-500/50">
                                <span className="text-2xl mr-3">💎</span>
                                <div>
                                    <p className="font-bold text-cyan-400">Diamond Tier</p>
                                    <p className="text-xs text-slate-400">Needs only 5 Stamps!</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-center mt-4 text-sm font-bold text-yellow-400">
                            Higher Tier = Less Stamps needed = More Free Stuff!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}