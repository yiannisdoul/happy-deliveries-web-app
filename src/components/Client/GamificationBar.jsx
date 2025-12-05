import React, { useState } from 'react';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { calculateTier, TIERS } from '../../utils/tierSystem';

export default function GamificationBar({ monthlyDeliveryCount = 0 }) {
    const { current, next, progress, toNext } = calculateTier(monthlyDeliveryCount);
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 relative overflow-hidden transition-all duration-300">
            {/* Background Texture/Gradient */}
            <div className={`absolute top-0 right-0 w-40 h-40 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${current.color}`}></div>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl filter drop-shadow-sm">{current.icon}</span>
                        <div>
                            <h3 className={`text-lg font-bold ${current.textColor} uppercase tracking-wider leading-none`}>
                                {current.name} Tier
                            </h3>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                                Goal: {current.slotsNeeded} Stamps/Freebie
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Toggle Info Button */}
                <button 
                    onClick={() => setShowInfo(!showInfo)}
                    className="flex items-center text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
                >
                    {showInfo ? 'Hide Perks' : 'View Perks'}
                    {showInfo ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </button>
            </div>

            {/* Progress Bar Section */}
            <div className="relative">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                    <span>{monthlyDeliveryCount} / {next ? next.floor : '∞'} Monthly Deliveries</span>
                    {next && <span className="text-gray-500">Next: {next.name}</span>}
                </div>
                
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className={`h-full ${current.color} transition-all duration-1000 ease-out relative`} 
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white opacity-20 animate-[pulse_2s_infinite]"></div>
                    </div>
                </div>

                <p className="text-xs text-center mt-2 text-gray-600 font-medium">
                    {next 
                        ? <span>Complete <b>{toNext}</b> more jobs this month to reach <span className={`${next.textColor} font-bold`}>{next.name}</span>!</span>
                        : <span className="text-cyan-600 font-bold">You are a {current.name} Legend! Maximum perks active. 👑</span>
                    }
                </p>
            </div>

            {/* Expanded Perks Table (The Fix) */}
            {showInfo && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">Monthly Status Levels</h4>
                    <div className="space-y-1">
                        {TIERS.map(t => (
                            <div 
                                key={t.id} 
                                // Adjust padding for compact view and ensure text sizes are minimal
                                className={`grid grid-cols-12 items-center text-[10px] p-1.5 rounded-lg transition-colors min-w-full ${
                                    current.id === t.id 
                                    ? 'bg-blue-50 border border-blue-100 shadow-sm' 
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                {/* Icon & Name: col-span-3 (no change) */}
                                <div className="col-span-3 flex items-center gap-2 font-bold">
                                    <span className="text-base">{t.icon}</span>
                                    <span className={`font-bold ${t.textColor}`}>{t.name}</span>
                                </div>
                                
                                {/* Requirement: col-span-5 - Text is highly condensed here */}
                                <div className="col-span-5 text-gray-500 font-medium">
                                    {t.reqText}
                                </div>

                                {/* Perk: col-span-4 - Text is highly condensed here */}
                                <div className="col-span-4 text-right font-bold text-gray-700">
                                    {t.perk}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 text-center italic">
                        *Delivery counts reset monthly. Surplus rolls over (up to 49).
                    </p>
                </div>
            )}
        </div>
    );
}