import React from 'react';
import { TrendingUp, Award, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Import TIERS config to display actual data
import { TIERS } from '../utils/tierSystem'; 

export default function TierProgram() {
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
                <TrendingUp className="w-10 h-10 text-blue-600 mb-4" />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">
                    Progressive Tier Status: Happy Levels
                </h1>
                
                <p className="text-lg text-gray-600 mb-8">
                    Our status system rewards consistency. The more you deliver per month, the fewer jobs you need to earn a freebie in the <strong>next</strong> cycle.
                </p>

                <h2 className="text-2xl font-bold text-blue-700 border-b border-blue-100 pb-2">
                    Tier Requirements & Benefits
                </h2>
                
                <div className="mt-4 space-y-3">
                    {TIERS.map((t) => (
                        <div key={t.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm">
                            <div className="flex items-center mb-2 sm:mb-0">
                                <span className="text-2xl mr-3">{t.icon}</span>
                                <div>
                                    <h3 className={`font-bold text-lg ${t.textColor}`}>{t.name}</h3>
                                    <p className="text-sm text-gray-500">{t.reqText} / Month</p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                                <p className="font-bold text-green-700">{t.perk}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-blue-700 border-b border-blue-100 pb-2 pt-8">
                    The Rollover Advantage
                </h2>
                <p className="text-gray-700 mt-4">
                    To prevent frustration from monthly resets, we introduced <strong className="font-bold">Surplus Rollover</strong>.
                    <ul className="list-disc list-inside ml-4 mt-3 space-y-2">
                        <li>At the start of a new month, your delivery count resets, but any <strong>surplus</strong> you earned above your achieved Tier's floor is carried over.</li>
                        <li>*Example:* If you achieved Iron Tier (Floor 50) with 65 deliveries, you roll over $65 - 50 = 15$ deliveries. You start the next month already in Wood Tier!</li>
                        <li>This means consistent users always maintain a significant head start. (Rollover is capped at 49 deliveries).</li>
                    </ul>
                </p>
            </div>
        </div>
    );
}