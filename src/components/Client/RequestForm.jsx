import React from 'react';
import { FileText, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RequestForm({ 
    formData, setFormData, handleSubmit, handlePhoneInput, 
    timeStatus, isLate, total, subtotal, discount, editingId, loading 
}) {
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
                
                {/* Amount and Total Calculation */}
                {timeStatus.isValid ? (
                    <div id="total-section-target">
                        <div className="relative rounded shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><DollarSign className="h-4 w-4 text-gray-400" /></div>
                            <input type="number" required className="pl-8 w-full border rounded py-2 text-sm" placeholder="Offer Amount ($)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        
                        {isLate && <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100">
                            <p className="font-bold">Price before discount: ${subtotal.toFixed(2)} (+50% Surcharge)</p>
                            <label className="flex items-center mt-1">
                                <input type="checkbox" required checked={formData.acceptSurcharge} onChange={e => setFormData({...formData, acceptSurcharge: e.target.checked})} className="mr-2" /> I accept
                            </label>
                        </div>}
                        
                        {discount > 0 ? (
                            <div className="mt-3 bg-green-50 p-3 rounded border border-green-100">
                                <p className="text-green-800 font-bold text-sm">REWARD APPLIED: -${discount.toFixed(2)}</p>
                                <p className="text-lg font-bold text-green-700">FINAL TOTAL: ${total.toFixed(2)}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 font-bold mt-2">Total Estimate: ${total.toFixed(2)}</p>
                        )}
                        
                    </div>
                ) : (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center animate-pulse">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-800 font-bold text-sm">Cannot Complete Request</p>
                        <p className="text-red-600 text-xs mt-1">{timeStatus.error}</p>
                        <p className="text-red-600 text-xs mt-1">Please select a different time.</p>
                    </div>
                )}
                
                {/* Notes */}
                <div>
                    <label className="text-xs text-gray-500 font-bold mb-1 block">Notes <span className="font-normal lowercase">(what is being delivered?)</span></label>
                    <textarea required className="w-full border rounded p-2 text-sm" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                
                {/* Submit Button */}
                <button type="submit" disabled={loading || !timeStatus.isValid} className={`w-full py-3 rounded text-white font-bold shadow-md text-sm transition-all ${!timeStatus.isValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {loading ? 'Processing...' : (editingId ? 'Update Request' : 'Submit Request')}
                </button>
            </form>
        </>
    );
}