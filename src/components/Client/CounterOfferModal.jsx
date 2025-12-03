import React from 'react';
import { XCircle, Edit2, X, DollarSign, Clock } from 'lucide-react'; 

export default function CounterOfferModal({
    counteringJob, setCounteringJob, handleSubmitCounterModal,
    counterNote, setCounterNote, counterPrice, setCounterPrice, 
    counterDate, setCounterDate, counterHour, setCounterHour, 
    counterMinute, setCounterMinute, counterAmpm, setCounterAmpm
}) {
    if (!counteringJob) return null;
    
    const rejectionReason = counteringJob.rejectionDetails?.reason;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-blue-600 flex items-center"><Edit2 className="h-5 w-5 mr-2"/> Counter Offer</h3>
                 <button onClick={() => setCounteringJob(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">
                  The Owner rejected your request due to <span className="font-semibold text-red-600">{rejectionReason}</span>. 
                  Use this one-time chance to modify the job details.
              </p>
              
              <form onSubmit={handleSubmitCounterModal} className="space-y-4">
                 
                 {/* PRICE COUNTER (Visible if Owner's reason was price) */}
                 {rejectionReason === 'price' && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1 flex items-center"><DollarSign className="h-3 w-3 mr-1"/> Your Proposed Price ($)</label>
                        <input 
                            type="number" 
                            required
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            placeholder="Enter New Price"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                        />
                    </div>
                 )}

                 {/* TIME COUNTER (Visible if Owner's reason was time) */}
                 {rejectionReason === 'time' && (
                    <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <label className="block text-xs font-bold text-blue-800 uppercase flex items-center"><Clock className="h-3 w-3 mr-1"/> Propose New Time</label>
                        <input type="date" required className="w-full p-2 border rounded text-sm" value={counterDate} onChange={e => setCounterDate(e.target.value)} />
                        <div className="flex gap-2">
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={counterHour} onChange={e => setCounterHour(e.target.value)}>{[...Array(12)].map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={counterMinute} onChange={e => setCounterMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={counterAmpm} onChange={e => setCounterAmpm(e.target.value)}><option>AM</option><option>PM</option></select>
                        </div>
                    </div>
                 )}

                 {/* GENERAL NOTES / OTHER REASON */}
                 {(rejectionReason === 'other' || rejectionReason === 'price' || rejectionReason === 'time') && (
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes (Why your counter is better)</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm" 
                            rows={3}
                            placeholder={rejectionReason === 'other' ? "Explain your counter-proposal." : "Optional: Add a note to support your change."}
                            value={counterNote}
                            onChange={(e) => setCounterNote(e.target.value)}
                        />
                     </div>
                 )}

                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center">
                    <Edit2 className="h-4 w-4 mr-2"/> Send Counter Offer
                 </button>
              </form>
           </div>
        </div>
    );
}