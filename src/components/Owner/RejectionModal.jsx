import React from 'react';
import { XCircle, X } from 'lucide-react'; 
import { db } from '../../config/firebase'; 
import { doc, updateDoc } from 'firebase/firestore'; 
import { sendNotificationEmail, TEMPLATES } from '../../utils/emailService'; 

export default function RejectionModal({
    rejectingJobId, setRejectingJobId,
    rejectionReason, setRejectionReason, rejectionNote, setRejectionNote,
    counterPrice, setCounterPrice, counterDate, setCounterDate,
    counterHour, setCounterHour, counterMinute, setCounterMinute,
    counterAmpm, setCounterAmpm, isSubmitting, setIsSubmitting,
    clientEmail, clientName 
}) {
    if (!rejectingJobId) return null;

    const handleSubmitRejection = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const rejectionData = {
                reason: rejectionReason,
                note: rejectionNote,
                timestamp: new Date().toISOString()
            };

            if (rejectionReason === 'price') {
                if (!counterPrice) return alert("Please enter a new price");
                rejectionData.counterPrice = parseFloat(counterPrice);
            } else if (rejectionReason === 'time') {
                if (!counterDate) return alert("Please select a date");
                rejectionData.counterTime = { date: counterDate, hour: counterHour, minute: counterMinute, ampm: counterAmpm };
            }

            await updateDoc(doc(db, "requests", rejectingJobId), {
                status: 'rejected',
                rejectionDetails: rejectionData,
                hasUnreadEdit: false, 
                hasClientCountered: false 
            });

            // FIX: Ensure clientEmail is available before sending
            if (clientEmail) {
                sendNotificationEmail(TEMPLATES.CLIENT_STATUS_UPDATE, {
                    to_name: clientName || clientEmail, // Robust to_name fallback
                    to_email: clientEmail, 
                    subject: "Update: Request Rejected/Counter Offered",
                    message: `Your delivery request was rejected by the Owner due to ${rejectionReason}. Please log in to view the note and potential counter-offer.`,
                    status: "Rejected / Counter Offer",
                    link: window.location.origin + "/client"
                });
            }

            setRejectingJobId(null);
            setRejectionNote('');
            setCounterPrice('');
            alert("Request Rejected with Details sent to client.");
        } catch (e) {
            console.error("Rejection Error:", e);
            alert("Error rejecting. Check console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-red-600 flex items-center"><XCircle className="h-5 w-5 mr-2"/> Reject Request</h3>
                 <button onClick={() => setRejectingJobId(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
              </div>
              
              <form onSubmit={handleSubmitRejection} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    >
                        <option value="price">Money not enough</option>
                        <option value="time">Date/Time not suitable</option>
                        <option value="other">Other</option>
                    </select>
                 </div>

                 {/* COUNTER OFFER: PRICE */}
                 {rejectionReason === 'price' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proposed Price ($)</label>
                        <input 
                            type="number" 
                            required
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                        />
                    </div>
                 )}

                 {/* COUNTER OFFER: TIME */}
                 {rejectionReason === 'time' && (
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Proposed Time</label>
                        <input type="date" required className="w-full p-2 border rounded text-sm" value={counterDate} onChange={e => setCounterDate(e.target.value)} />
                        <div className="flex gap-2">
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={counterHour} onChange={e => setCounterHour(e.target.value)}>{[...Array(12)].map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={counterMinute} onChange={e => setCounterMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                            <select className="flex-1 p-2 border rounded text-sm bg-white" value={counterAmpm} onChange={e => setCounterAmpm(e.target.value)}><option>AM</option><option>PM</option></select>
                        </div>
                    </div>
                 )}

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Notes</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm" 
                        rows={3}
                        placeholder="Add details for the client..."
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                    />
                 </div>

                 <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 shadow-md">
                    {isSubmitting ? 'Sending...' : 'Submit Rejection'}
                 </button>
              </form>
           </div>
        </div>
    );
}