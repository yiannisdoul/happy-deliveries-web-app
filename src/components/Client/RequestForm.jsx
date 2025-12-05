import React from 'react';
import { FileText, Clock, DollarSign, AlertTriangle, CheckCircle, Scale, Box, Truck, Info } from 'lucide-react';

export default function RequestForm({ 
    formData, setFormData, handleSubmit, handlePhoneInput, 
    timeStatus, isLate, quoteResult, handleCalculateQuote, loading, editingId 
}) {
    
    // Helper to update nested dimension state
    const handleDimensionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            dimensions: { ...prev.dimensions, [field]: value }
        }));
    };

    return (
        <>
            <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {editingId ? "Edit Request" : "New Delivery Quote"}
            </h3>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-5 rounded-r shadow-sm">
                <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 font-medium leading-relaxed">
                        <p><strong>Automated Pricing:</strong> Enter your load details to get an instant quote. Heavy loads or long distances may require a custom review.</p>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* --- CONTACT DETAILS (Pickup/Dropoff) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">Pickup From</p>
                        <input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded" value={formData.pickupName} onChange={e => setFormData({...formData, pickupName: e.target.value})} />
                        <input type="text" inputMode="numeric" required placeholder="Phone (04...)" className="w-full text-sm p-2 border rounded" value={formData.pickupPhone} onChange={e => handlePhoneInput(e.target.value, 'pickupPhone')} />
                        {/* Note: In a real app, this would be a Google Places Autocomplete */}
                        <input required placeholder="Address (Suburb/Postcode)" className="w-full text-sm p-2 border rounded" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">Dropoff To</p>
                        <input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded" value={formData.dropoffName} onChange={e => setFormData({...formData, dropoffName: e.target.value})} />
                        <input type="text" inputMode="numeric" required placeholder="Phone (04...)" className="w-full text-sm p-2 border rounded" value={formData.dropoffPhone} onChange={e => handlePhoneInput(e.target.value, 'dropoffPhone')} />
                        <input required placeholder="Address (Suburb/Postcode)" className="w-full text-sm p-2 border rounded" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} />
                    </div>
                </div>

                {/* --- LOAD DETAILS (Weight & Dimensions) --- */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-100 space-y-3">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center">
                        <Box className="h-4 w-4 mr-2 text-blue-500"/> Load Details
                    </h4>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 font-bold mb-1">Total Weight (kg)</label>
                            <div className="relative">
                                <Scale className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                                <input 
                                    type="number" 
                                    required 
                                    placeholder="e.g. 50" 
                                    className="w-full pl-8 p-2 border rounded text-sm"
                                    value={formData.weight}
                                    onChange={e => setFormData({...formData, weight: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                             <label className="block text-xs text-gray-500 font-bold mb-1">Dimensions (cm)</label>
                             <div className="flex gap-2">
                                 <input type="number" required placeholder="L" className="w-full p-2 border rounded text-sm text-center" value={formData.dimensions.length} onChange={e => handleDimensionChange('length', e.target.value)} />
                                 <input type="number" required placeholder="W" className="w-full p-2 border rounded text-sm text-center" value={formData.dimensions.width} onChange={e => handleDimensionChange('width', e.target.value)} />
                                 <input type="number" required placeholder="H" className="w-full p-2 border rounded text-sm text-center" value={formData.dimensions.height} onChange={e => handleDimensionChange('height', e.target.value)} />
                             </div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <label className="flex items-center cursor-pointer bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:bg-blue-50 transition flex-1">
                            <input 
                                type="checkbox" 
                                className="h-4 w-4 text-blue-600 rounded"
                                checked={formData.requiresHelp}
                                onChange={e => setFormData({...formData, requiresHelp: e.target.checked})}
                            />
                            <span className="ml-2 text-xs font-medium text-gray-700">Driver Help (Load/Unload) <span className="text-blue-600 font-bold">+$50</span></span>
                        </label>
                        <label className="flex items-center cursor-pointer bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:bg-amber-50 transition flex-1">
                            <input 
                                type="checkbox" 
                                className="h-4 w-4 text-amber-600 rounded"
                                checked={formData.specializedHandling}
                                onChange={e => setFormData({...formData, specializedHandling: e.target.checked})}
                            />
                            <span className="ml-2 text-xs font-medium text-gray-700">Fragile / Hazardous <span className="text-amber-600 font-bold">(Requires Quote)</span></span>
                        </label>
                    </div>
                </div>

                {/* --- DATE & TIME --- */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <input type="date" required className="w-full p-2 border rounded text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="flex-1">
                         <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                         <div className="flex gap-1">
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.hour} onChange={e => setFormData({...formData, hour: e.target.value})}>{[...Array(12)].map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.minute} onChange={e => setFormData({...formData, minute: e.target.value})}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.ampm} onChange={e => setFormData({...formData, ampm: e.target.value})}><option>AM</option><option>PM</option></select>
                         </div>
                    </div>
                </div>
                
                {/* --- QUOTE CALCULATOR --- */}
                <div className="border-t border-gray-200 pt-4">
                    {!quoteResult ? (
                        <button 
                            type="button"
                            onClick={handleCalculateQuote}
                            disabled={!formData.from || !formData.to || !formData.weight}
                            className={`w-full py-3 rounded font-bold shadow-sm transition-all flex items-center justify-center ${(!formData.from || !formData.to || !formData.weight) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            <DollarSign className="h-4 w-4 mr-2"/> Calculate Price
                        </button>
                    ) : (
                        <div className={`p-4 rounded-lg border-l-4 ${quoteResult.status === 'NEGOTIATING' ? 'bg-amber-50 border-amber-500' : 'bg-green-50 border-green-500'}`}>
                            
                            {quoteResult.status === 'QUOTE' ? (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-green-800 uppercase tracking-wide">Standard Quote</span>
                                        <span className="text-2xl font-extrabold text-green-700">${quoteResult.price}</span>
                                    </div>
                                    <div className="text-xs text-green-800 space-y-1">
                                        <div className="flex justify-between"><span>Vehicle:</span> <strong>{quoteResult.vehicle}</strong></div>
                                        <div className="flex justify-between"><span>Distance:</span> <span>{quoteResult.distance} km</span></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center mb-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                                        <span className="font-bold text-amber-800">Manual Quote Required</span>
                                    </div>
                                    <p className="text-xs text-amber-900 mb-2">{quoteResult.reason}</p>
                                    <p className="text-xs italic text-amber-700">Submit this request and the Owner will contact you with a custom price.</p>
                                </>
                            )}
                            
                            <button 
                                type="button" 
                                onClick={() => handleCalculateQuote()} // Re-calculate
                                className="mt-3 text-xs text-blue-600 underline hover:text-blue-800"
                            >
                                Recalculate (Update Details)
                            </button>
                        </div>
                    )}
                </div>

                {/* --- SUBMIT BUTTON --- */}
                {quoteResult && (
                    <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center">
                        {loading ? 'Processing...' : (quoteResult.status === 'NEGOTIATING' ? 'Submit for Negotiation' : 'Book Delivery Now')}
                    </button>
                )}
            </form>
        </>
    );
}