import React from 'react';
import { TrendingUp, Award, ChevronLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        Level Up for Faster Rewards
                    </h1>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-2">How it works (Simple Version)</h2>
                    <ul className="space-y-3 text-blue-800 font-medium">
                        <li className="flex items-start">
                            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 font-bold text-sm">1</span>
                            Do more deliveries each month to climb the ladder (Dirt → Diamond).
                        </li>
                        <li className="flex items-start">
                            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 font-bold text-sm">2</span>
                            Higher levels make your Loyalty Card smaller.
                        </li>
                        <li className="flex items-start">
                            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 font-bold text-sm">3</span>
                            Smaller card = You earn free deliveries <span className="underline font-bold">much faster</span>!
                        </li>
                    </ul>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    The Levels
                </h2>
                
                <div className="space-y-3">
                    {TIERS.map((t) => (
                        <div key={t.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <span className="text-3xl">{t.icon}</span>
                                <div>
                                    <h3 className={`font-bold text-lg ${t.textColor}`}>{t.name}</h3>
                                    <p className="text-sm text-gray-500">{t.reqText}</p>
                                </div>
                            </div>
                            
                            <div className="mt-3 sm:mt-0 flex items-center text-sm font-bold bg-white px-3 py-2 rounded border border-gray-200 shadow-sm">
                                <span>Card Size:</span>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="text-green-600">{t.slotsNeeded} Stamps</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 bg-green-50 p-6 rounded-xl border border-green-100">
                    <h2 className="text-xl font-bold text-green-800 mb-3 flex items-center">
                        <Award className="w-6 h-6 mr-2" /> What is "Rollover"?
                    </h2>
                    <p className="text-green-900 mb-4 leading-relaxed">
                        Normally, your level resets every month. But we are nice! 
                        If you do extra deliveries above your level, we <strong>save them</strong> for next month.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm text-sm text-gray-700">
                        <p className="font-bold mb-1">Example:</p>
                        <p>You need <strong>10</strong> jobs for Wood. You did <strong>15</strong>.</p>
                        <p className="flex items-center gap-2 mt-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">15 Total</span>
                            <ArrowRight className="w-4 h-4 text-gray-400"/>
                            <span className="bg-gray-100 px-2 py-1 rounded">10 used for Wood</span>
                            <ArrowRight className="w-4 h-4 text-gray-400"/>
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-bold">5 Rolled Over!</span>
                        </p>
                        <p className="mt-2">Next month, you start with <strong>5 points</strong> already!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}