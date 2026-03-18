import React, { useState } from 'react';
import { FileText, Clock, AlertTriangle, CheckCircle, PhoneCall, Info, Calendar as CalendarIcon, X, ChevronRight, UploadCloud } from 'lucide-react';
import DeliveryCalculator from './DeliveryCalculator'; 
import { checkSlotStatus } from '../../utils/timeBlocking'; 

const TimePickerModal = ({ isOpen, onClose, onSelect, busyIntervals, selectedTime, jobProfile }) => {
    if (!isOpen) return null;
    const slots = [];
    const startHour = 7;
    const endHour = 18; 

    for (let h = startHour; h <= endHour; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 18 && m > 0) continue;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayHour = h > 12 ? h - 12 : h; 
            const displayMinute = m === 0 ? '00' : '30';
            
            const checkMins = (h * 60) + m; 
            const status = checkSlotStatus(checkMins, jobProfile, busyIntervals);
            const isSelected = selectedTime.hour === displayHour.toString() && 
                               selectedTime.minute === displayMinute && 
                               selectedTime.ampm === ampm;

            slots.push({
                hour: displayHour.toString(), minute: displayMinute, ampm: ampm,
                label: `${displayHour}:${displayMinute} ${ampm}`,
                isBlocked: status.isBlocked,
                reason: status.reason,
                isSelected
            });
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-600"/> Select Arrival Time</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5 text-gray-500"/></button>
                </div>
                <div className="px-4 py-2 flex gap-4 text-xs font-medium text-gray-500 bg-white border-b border-gray-50">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full border border-gray-300 mr-1.5"></span> Available</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-200 mr-1.5"></span> Blocked</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-600 mr-1.5"></span> Selected</div>
                </div>
                <div className="p-4 overflow-y-visible grid grid-cols-2 gap-3 relative">
                    {slots.map((slot, index) => (
                        <div key={index} className="relative group w-full">
                            <button
                                disabled={slot.isBlocked}
                                onClick={() => { onSelect(slot.hour, slot.minute, slot.ampm); onClose(); }}
                                className={`w-full py-3 px-2 rounded-lg text-sm font-bold border transition-all ${slot.isBlocked ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed line-through decoration-gray-400' : slot.isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-200' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm'}`}
                            >
                                {slot.label}
                            </button>
                            
                            {slot.isBlocked && slot.reason === 'overlap' && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-gray-800 text-white text-[10px] leading-relaxed p-2.5 rounded-lg shadow-xl z-[100] text-center pointer-events-none">
                                    This logistics window conflicts with another booked delivery.
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function RequestForm({ 
    formData, setFormData, handleSubmit, handlePhoneInput, 
    timeStatus, isLate, total, subtotal, discount, editingId, loading, isQuote,
    busyIntervals = [], jobProfile, cancelEdit,
    receiptFile, handleReceiptChange 
}) {
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleTimeSelect = (h, m, ampm) => {
        setFormData(prev => ({ ...prev, hour: h, minute: m, ampm: ampm }));
    };

    const handleCalculatorUpdate = (calcData) => {
        setFormData(prev => ({
            ...prev,
            weightBracket: calcData.weightBracket, 
            actualWeightLabel: calcData.weight,
            actualDistance: calcData.distance,
            flights: calcData.flights, 
            difficultAccess: calcData.difficultAccess, 
            calculatedBasePrice: calcData.baseTotal, 
            requiredTrips: calcData.trips,
            isQuoteRequired: calcData.isQuote,
            accessCost: calcData.accessCost
        }));
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-blue-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />{editingId ? "Edit Request" : "New Delivery"}
                </h3>
                {editingId && (
                    <button type="button" onClick={cancelEdit} className="text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded flex items-center transition-colors">
                        <X className="h-3 w-3 mr-1"/> Cancel Edit
                    </button>
                )}
            </div>

            {busyIntervals.length > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-2 mb-4 rounded-r text-xs text-orange-800 flex items-center animate-in fade-in slide-in-from-top-2">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>Some slots are fully booked for this date.</span>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Pickup From</p>
                    <input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.pickupName} onChange={e => setFormData({...formData, pickupName: e.target.value})} />
                    <div className="flex rounded shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">+61</span>
                        <input type="text" inputMode="numeric" required placeholder="4XX XXX XXX" className="flex-1 w-full px-3 py-2 rounded-r border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.pickupPhone} onChange={e => handlePhoneInput(e.target.value, 'pickupPhone')} />
                    </div>
                    <input required placeholder="Address (From)" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Dropoff To</p>
                    <input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.dropoffName} onChange={e => setFormData({...formData, dropoffName: e.target.value})} />
                    <div className="flex rounded shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">+61</span>
                        <input type="text" inputMode="numeric" required placeholder="4XX XXX XXX" className="flex-1 w-full px-3 py-2 rounded-r border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.dropoffPhone} onChange={e => handlePhoneInput(e.target.value, 'dropoffPhone')} />
                    </div>
                    <input required placeholder="Address (To)" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} />
                </div>
                
                <DeliveryCalculator 
                    onUpdate={handleCalculatorUpdate} 
                    initialDistance={formData.actualDistance || 50} 
                />

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase mt-2">Date & Delivery Time</label>
                    <p className="text-[10px] font-bold text-blue-600 mb-1">Please pick the most appropriate delivery hour.</p>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input type="date" required className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <button type="button" onClick={() => setShowTimePicker(true)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-400 transition flex items-center justify-between group">
                            <span>{formData.hour}:{formData.minute} {formData.ampm}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition"/>
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 leading-tight px-1">
                        * Selected time is your estimated <strong className="text-gray-700">Arrival/Delivery time</strong>. We will arrive at the pickup location earlier to begin loading.
                    </p>
                    <TimePickerModal 
                        isOpen={showTimePicker} 
                        onClose={() => setShowTimePicker(false)} 
                        onSelect={handleTimeSelect} 
                        busyIntervals={busyIntervals} 
                        selectedTime={{ hour: formData.hour, minute: formData.minute, ampm: formData.ampm }} 
                        jobProfile={jobProfile} 
                    />
                </div>
                
                <div className="flex gap-2 mt-2">{['cash', 'bank'].map((m) => (<div key={m} onClick={() => setFormData({...formData, paymentMethod: m})} className={`flex-1 p-2 rounded border cursor-pointer flex items-center justify-between text-sm ${formData.paymentMethod === m ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}><span className="capitalize">{m}</span>{formData.paymentMethod === m && <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle className="h-3 w-3 text-white" /></div>}</div>))}</div>
                {formData.paymentMethod === 'bank' && <div className="text-xs bg-blue-50 p-2 rounded text-blue-800 border border-blue-100"><p>BSB: 063-159 | ACC: 1080 1372</p></div>}
                
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

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-2">
                    <p className="text-xs font-bold text-blue-800 uppercase flex items-center">
                        Attach Receipt / PO <span className="text-red-500 ml-1">*</span>
                    </p>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition">
                        <div className="flex flex-col items-center justify-center pt-3 pb-4">
                            <UploadCloud className="w-6 h-6 mb-2 text-blue-400" />
                            <p className="text-xs text-gray-500 text-center px-4">
                                {receiptFile ? <span className="font-bold text-blue-600">{receiptFile.name}</span> : <><span className="font-semibold text-blue-600">Click to upload document</span> (PDF or Image)</>}
                            </p>
                        </div>
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleReceiptChange} />
                    </label>
                    {formData.receiptUrl && !receiptFile && <p className="text-[10px] text-green-600 font-bold mt-1">✓ Receipt currently attached</p>}
                </div>

                {/* NEW: STRICT POLICY CHECKBOX */}
                <label className="flex items-start mt-4 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition shadow-sm">
                    <input 
                        type="checkbox" 
                        required 
                        checked={formData.policyAgreed || false} 
                        onChange={e => setFormData({...formData, policyAgreed: e.target.checked})} 
                        className="mt-1 mr-3 h-4 w-4 text-red-600 rounded focus:ring-red-500 border-red-300" 
                    />
                    <span className="text-[11px] sm:text-xs text-red-900 font-medium leading-tight">
                        <strong className="block uppercase mb-0.5 tracking-wide">Warning: Wrong Delivery Penalty</strong>
                        I understand that if the attached document is incorrect and results in the wrong items being picked up/delivered, I will be liable for a <strong>2nd full delivery fee PLUS a 25% return-to-warehouse surcharge</strong>.
                    </span>
                </label>

                <div>
                    <label className="text-xs text-gray-500 font-bold mb-1 block mt-2">Additional Instructions <span className="font-normal lowercase">(optional - e.g. gate codes)</span></label>
                    <textarea className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                
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
                            {isLate && <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100"><p className="font-bold">Late Booking Surcharge Applied: +50%</p><label className="flex items-center mt-1"><input type="checkbox" required checked={formData.acceptSurcharge} onChange={e => setFormData({...formData, acceptSurcharge: e.target.checked})} className="mr-2" /> I accept</label></div>}
                            {discount > 0 && (
                                <div className="mt-3 bg-green-50 p-3 rounded border border-green-100 relative overflow-hidden">
                                    <div className="relative z-10"><p className="text-green-800 font-bold text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> REWARD APPLIED</p><p className="text-xs text-green-700 mt-0.5">-${discount.toFixed(2)}</p></div>
                                </div>
                            )}
                            {(isLate || discount > 0) && (
                                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-700">Final Adjusted Total:</span>
                                    <span className="text-xl font-extrabold text-blue-900">${total.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="px-3 py-2 bg-blue-50 rounded border border-blue-100 flex items-start">
                                <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800">
                                    <strong>Note:</strong> This is an initial offer. The Owner may accept or reject based on availability. 
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center animate-pulse"><AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" /><p className="text-red-800 font-bold text-sm">Cannot Complete Request</p><p className="text-red-600 text-xs mt-1">{timeStatus.error}</p></div>
                    )
                )}
                
                {editingId ? (
                    <div className="flex gap-3">
                        <button type="button" onClick={cancelEdit} disabled={loading} className="w-1/3 py-3 rounded text-gray-700 bg-gray-200 hover:bg-gray-300 font-bold shadow-sm text-sm transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || !timeStatus.isValid || isQuote} className={`w-2/3 py-3 rounded text-white font-bold shadow-md text-sm transition-all ${(loading || !timeStatus.isValid || isQuote) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {loading ? 'Processing...' : (isQuote ? 'Call to Book' : 'Update Request')}
                        </button>
                    </div>
                ) : (
                    <button type="submit" disabled={loading || !timeStatus.isValid || isQuote} className={`w-full py-3 rounded text-white font-bold shadow-md text-sm transition-all ${(loading || !timeStatus.isValid || isQuote) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {loading ? 'Processing...' : (isQuote ? 'Call to Book' : 'Submit Request')}
                    </button>
                )}
            </form>
        </>
    );
}