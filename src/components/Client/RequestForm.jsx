import React from 'react';
import { FileText, Clock, AlertTriangle, CheckCircle, PhoneCall, Info } from 'lucide-react';
import { DISTANCE_OPTIONS, WEIGHT_OPTIONS } from '../../utils/pricingCalculator';

export default function RequestForm({ 
    formData, setFormData, handleSubmit, handlePhoneInput, 
    timeStatus, isLate, total, subtotal, discount, editingId, loading, isQuote 
}) {
    const currentDist = DISTANCE_OPTIONS[formData.distIndex];
    const currentWeight = WEIGHT_OPTIONS[formData.weightIndex];

    return (
        <>
            <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center"><FileText className="h-5 w-5 mr-2" />{editingId ? "Edit Request" : "New Delivery"}</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-r shadow-sm">
                <div className="flex items-start">
                    <Clock className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-red-800 font-medium leading-relaxed space-y-1">
                        <p><span className="font-bold uppercase tracking-wide">Important:</span> We require at least <span className="underline decoration-red-400 font-bold">2 hours notice</span>.</p>
                        <p>Operating Hours: <span className="font-semibold">7am - 6pm</span>.</p>
                        <p className="font-bold text-red-700 pt-1">* 50% surcharge applies same-day after 2 PM.</p>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Pickup Section */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Pickup From</p>
                    <input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.pickupName} onChange={e => setFormData({...formData, pickupName: e.target.value})} />
                    <div className="flex rounded shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">+61</span>
                        <input type="text" inputMode="numeric" required placeholder="4XX XXX XXX" className="flex-1 w-full px-3 py-2 rounded-r border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.pickupPhone} onChange={e => handlePhoneInput(e.target.value, 'pickupPhone')} />
                    </div>
                    <input required placeholder="Address (From)" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} />
                </div>
                
                {/* Dropoff Section */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Dropoff To</p>
                    <input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.dropoffName} onChange={e => setFormData({...formData, dropoffName: e.target.value})} />
                    <div className="flex rounded shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">+61</span>
                        <input type="text" inputMode="numeric" required placeholder="4XX XXX XXX" className="flex-1 w-full px-3 py-2 rounded-r border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.dropoffPhone} onChange={e => handlePhoneInput(e.target.value, 'dropoffPhone')} />
                    </div>
                    <input required placeholder="Address (To)" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} />
                </div>
                
                {/* Distance & Weight Sliders */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
                    
                    {/* Distance Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-blue-800 uppercase">Est. Distance</label>
                            <span className="text-sm font-bold text-blue-900 bg-white px-2 py-0.5 rounded shadow-sm">
                                {currentDist.label}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max={DISTANCE_OPTIONS.length - 1} 
                            step="1"
                            value={formData.distIndex}
                            onChange={(e) => setFormData({...formData, distIndex: parseInt(e.target.value)})}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    {/* Weight Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-blue-800 uppercase">Total Weight</label>
                            <span className="text-sm font-bold text-blue-900 bg-white px-2 py-0.5 rounded shadow-sm">
                                {currentWeight.label}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max={WEIGHT_OPTIONS.length - 1} 
                            step="1"
                            value={formData.weightIndex}
                            onChange={(e) => setFormData({...formData, weightIndex: parseInt(e.target.value)})}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>

                {/* Date & Time Section */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mt-1">Date & Time</label>
                    <input type="date" required className="w-full p-2 border rounded text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    <div className="flex gap-2">
                        <select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.hour} onChange={e => setFormData({...formData, hour: e.target.value})}>{[...Array(12)].map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                        <select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.minute} onChange={e => setFormData({...formData, minute: e.target.value})}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                        <select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.ampm} onChange={e => setFormData({...formData, ampm: e.target.value})}><option>AM</option><option>PM</option></select>
                    </div>
                </div>
                
                {/* Payment Method */}
                <div className="flex gap-2 mt-2">{['cash', 'bank'].map((m) => (<div key={m} onClick={() => setFormData({...formData, paymentMethod: m})} className={`flex-1 p-2 rounded border cursor-pointer flex items-center justify-between text-sm ${formData.paymentMethod === m ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}><span className="capitalize">{m}</span>{formData.paymentMethod === m && <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle className="h-3 w-3 text-white" /></div>}</div>))}</div>
                {formData.paymentMethod === 'bank' && <div className="text-xs bg-blue-50 p-2 rounded text-blue-800 border border-blue-100"><p>BSB: 063-000 | ACC: 1234 5678</p></div>}
                
                {/* Purchase Order */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Purchase Order</p>
                    <div className="flex items-center gap-3">
                        <input type="text" placeholder="Enter PO Number" className={`flex-1 p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${formData.poType === 'na' ? 'bg-gray-100 text-gray-400' : 'bg-white'}`} value={formData.purchaseOrder} onFocus={() => setFormData({...formData, poType: 'entry'})} onChange={e => setFormData({...formData, purchaseOrder: e.target.value, poType: 'entry'})} />
                        <label className="flex items-center cursor-pointer select-none">
                            <input type="radio" checked={formData.poType === 'na'} onChange={() => setFormData({...formData, poType: 'na', purchaseOrder: ''})} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">N/A</span>
                        </label>
                    </div>
                </div>
                
                {/* Pricing & Quote UI */}
                {isQuote ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm animate-pulse">
                        <div className="flex items-center">
                            <PhoneCall className="h-6 w-6 text-yellow-600 mr-3" />
                            <div>
                                <p className="font-bold text-yellow-900">Special Quote Required</p>
                                <p className="text-xs text-yellow-800 mt-1">This job exceeds our standard sizing. Please call us to arrange a custom quote.</p>
                                <a href="tel:+61420882302" className="block mt-2 font-bold text-blue-600 text-lg hover:underline">+61 420 882 302</a>
                            </div>
                        </div>
                    </div>
                ) : (
                    timeStatus.isValid ? (
                        <div id="total-section-target" className="space-y-3">
                            {/* Price is now calculated automatically */}
                            <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold">Estimated Base Price</p>
                                <p className="text-2xl font-bold text-gray-800">${total > 0 ? (isLate ? (subtotal-surcharge).toFixed(2) : subtotal.toFixed(2)) : '0.00'}</p>
                            </div>
                            
                            {/* POLICY NOTE - Added as requested */}
                            <div className="px-3 py-2 bg-blue-50 rounded border border-blue-100 flex items-start">
                                <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800">
                                    <strong>Note:</strong> This is an initial offer. The Owner may accept or reject based on availability. 
                                    If rejected, you will have <strong>one chance</strong> to negotiate a new price or time.
                                </p>
                            </div>
                            
                            {isLate && <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100">
                                <p className="font-bold">Price before discount: ${subtotal.toFixed(2)} (+50% Surcharge)</p>
                                <label className="flex items-center mt-1">
                                    <input type="checkbox" required checked={formData.acceptSurcharge} onChange={e => setFormData({...formData, acceptSurcharge: e.target.checked})} className="mr-2" /> I accept
                                </label>
                            </div>}
                            
                            {discount > 0 ? (
                                <div className="mt-3 bg-green-50 p-3 rounded border border-green-100 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-green-800 font-bold text-sm flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-1" /> REWARD APPLIED
                                        </p>
                                        <p className="text-xs text-green-700 mt-0.5">
                                            -${discount.toFixed(2)} (Max capped at $160)
                                        </p>
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                            <p className="text-xs text-green-700 uppercase font-bold">Total to Pay</p>
                                            <p className="text-2xl font-extrabold text-green-800">${total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    {/* Subtle alert if partial value used */}
                                    {subtotal < 160 && (
                                        <p className="mt-2 text-[10px] text-green-800 italic opacity-80">
                                            Note: Delivery cost is under $160. Remaining reward value is not carried over.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 font-bold mt-2 text-right">Total: ${total.toFixed(2)}</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center animate-pulse">
                            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-800 font-bold text-sm">Cannot Complete Request</p>
                            <p className="text-red-600 text-xs mt-1">{timeStatus.error}</p>
                        </div>
                    )
                )}
                
                {/* Notes */}
                <div>
                    <label className="text-xs text-gray-500 font-bold mb-1 block">Notes <span className="font-normal lowercase">(what is being delivered?)</span></label>
                    <textarea required className="w-full border rounded p-2 text-sm" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                
                {/* Submit Button */}
                <button type="submit" disabled={loading || !timeStatus.isValid || isQuote} className={`w-full py-3 rounded text-white font-bold shadow-md text-sm transition-all ${(!timeStatus.isValid || isQuote) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {loading ? 'Processing...' : (isQuote ? 'Call to Book' : (editingId ? 'Update Request' : 'Submit Request'))}
                </button>
            </form>
        </>
    );
}