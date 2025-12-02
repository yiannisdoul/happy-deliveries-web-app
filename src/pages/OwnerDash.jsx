import React, { useState, useEffect, useRef } from 'react';
import { 
    CheckCircle, XCircle, Calendar, AlertCircle, Bell, Minimize2, 
    User, Camera, PenTool, X, DollarSign, Clock, Package, Edit2 
} from 'lucide-react'; 
import { db } from '../config/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas'; 

export default function OwnerDash() {
  const [jobs, setJobs] = useState([]);
  const [clientMap, setClientMap] = useState({});
  const [filter, setFilter] = useState('all'); 
  
  const [editedJobs, setEditedJobs] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Delivery Modal State
  const [deliveringJobId, setDeliveringJobId] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigPad = useRef({}); 
  
  // VIEW PROOF MODAL
  const [viewProofJob, setViewProofJob] = useState(null);

  // --- REJECTION MODAL STATE ---
  const [rejectingJobId, setRejectingJobId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('price'); // price, time, other
  const [rejectionNote, setRejectionNote] = useState('');
  // Counter Offer State
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDate, setCounterDate] = useState('');
  const [counterHour, setCounterHour] = useState('10');
  const [counterMinute, setCounterMinute] = useState('00');
  const [counterAmpm, setCounterAmpm] = useState('AM');

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  useEffect(() => {
    const q = query(collection(db, "requests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => {
        const statusOrder = { pending: 1, accepted: 2, delivered: 3, rejected: 4 };
        const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (statusDiff !== 0) return statusDiff;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setJobs(docs);

      const unread = docs.filter(job => job.hasUnreadEdit === true);
      if (unread.length > 0) {
        setEditedJobs(unread);
        setShowNotification(true);
        setIsMinimized(false); 
      } else {
        setEditedJobs([]);
        setShowNotification(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const map = {};
        querySnapshot.forEach((doc) => map[doc.id] = doc.data());
        setClientMap(map);
      } catch (e) {
        console.error("Error fetching clients:", e);
      }
    };
    fetchClients();
  }, []);

  const handleStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, "requests", id), { status: newStatus }); } catch (e) { console.error(e); }
  };
  
  // NEW FUNCTION: Mark job as reviewed to clear the notification flag
  const handleMarkAsReviewed = async (jobId) => {
    try {
        await updateDoc(doc(db, "requests", jobId), { hasUnreadEdit: false });
        // The useEffect dependency handles re-filtering editedJobs
    } catch (e) {
        alert("Error marking job as reviewed.");
        console.error(e);
    }
  };

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
            rejectionData.counterTime = {
                date: counterDate,
                hour: counterHour,
                minute: counterMinute,
                ampm: counterAmpm
            };
        }

        await updateDoc(doc(db, "requests", rejectingJobId), {
            status: 'rejected',
            rejectionDetails: rejectionData,
            hasUnreadEdit: true, // Notify client of rejection/counter
            hasClientCountered: false // Reset counter flag for the client
        });

        // Reset
        setRejectingJobId(null);
        setRejectionNote('');
        setCounterPrice('');
        alert("Request Rejected with Details sent to client.");
    } catch (e) {
        console.error(e);
        alert("Error rejecting.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const openRejectionModal = (job) => {
      setRejectingJobId(job.id);
      // Pre-fill counter with current price/time
      setCounterPrice(job.totalAmount || job.amount); 
      setCounterDate(job.date);
      setCounterHour(job.hour);
      setCounterMinute(job.minute);
      setCounterAmpm(job.ampm);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Cloudinary Upload failed with status ${res.status}`);
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    if (!receiverName) return alert("Please enter receiver's name");
    if (sigPad.current.isEmpty()) return alert("Please sign the delivery");
    if (!photoFile) return alert("Please take a photo");

    setIsSubmitting(true);
    try {
      const photoURL = await uploadToCloudinary(photoFile);
      const sigData = sigPad.current.getCanvas().toDataURL('image/png');
      const sigBlob = await (await fetch(sigData)).blob();
      const sigURL = await uploadToCloudinary(sigBlob);

      await updateDoc(doc(db, "requests", deliveringJobId), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        hasUnreadEdit: false, // Delivered is a final state, clear flag
        pod: { receiver: receiverName, photo: photoURL, signature: sigURL }
      });

      setDeliveringJobId(null);
      setReceiverName('');
      setPhotoFile(null);
      alert("Job Completed & Proof Saved!");
    } catch (error) {
      console.error("Delivery Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = async () => {
    if (dontShowAgain && editedJobs.length > 0) {
      try {
        const promises = editedJobs.map(job => updateDoc(doc(db, "requests", job.id), { hasUnreadEdit: false }));
        await Promise.all(promises);
      } catch (e) { console.error(e); }
    }
    setShowNotification(false);
    setDontShowAgain(false);
  };

  const createGoogleCalendarLink = (job) => {
    if (!job.date || !job.hour) return "#";
    let hour = parseInt(job.hour);
    if (job.ampm === 'PM' && hour !== 12) hour += 12;
    if (job.ampm === 'AM' && hour === 12) hour = 0;
    const formatTime = (h, m) => `${job.date.replace(/-/g, '')}T${h.toString().padStart(2, '0')}${m}00`;
    const client = clientMap[job.clientId] || {};
    const phoneDisplay = client.phone ? `+61 ${client.phone}` : 'No Phone';
    const clientInfo = `${client.fullName || 'Unknown'} (${phoneDisplay})`;
    const title = encodeURIComponent(`Delivery: ${job.from} --> ${job.to}`);
    const details = encodeURIComponent(`CLIENT: ${clientInfo}\nPrice: $${job.totalAmount||job.amount}\nPO: ${job.purchaseOrder||'N/A'}\nPickup: ${job.from}\nDrop: ${job.to}\nNotes: ${job.notes}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${formatTime(hour, job.minute)}/${formatTime(hour + 1, job.minute)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 relative min-h-screen pb-24">
      
      {/* FILTER HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg space-x-1 overflow-x-auto w-full sm:w-auto">
            {['all', 'pending', 'accepted', 'delivered', 'rejected'].map(status => (
                <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-md text-xs font-bold capitalize transition-all whitespace-nowrap ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{status}</button>
            ))}
        </div>
      </div>

      {/* --- REJECTION MODAL --- */}
      {rejectingJobId && (
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
      )}
      
      {/* DELIVERY MODAL (Same as before) */}
      {deliveringJobId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-blue-900">Complete Delivery</h3>
                 <button onClick={() => setDeliveringJobId(null)} className="text-gray-400 hover:text-gray-600"><XCircle /></button>
              </div>
              <form onSubmit={handleSubmitDelivery} className="space-y-4">
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Receiver Name</label><input required type="text" placeholder="Who accepted the package?" className="w-full border border-gray-300 rounded-lg p-2" value={receiverName} onChange={e => setReceiverName(e.target.value)} /></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Proof Photo</label><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative"><input type="file" accept="image/*" capture="environment" onChange={e => setPhotoFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="flex flex-col items-center justify-center text-gray-500">{photoFile ? <div className="text-green-600 font-bold flex items-center"><CheckCircle className="h-5 w-5 mr-1"/> Photo Selected</div> : <><Camera className="h-8 w-8 mb-1" /><span className="text-sm">Tap to take photo</span></>}</div></div></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Signature</label><div className="border border-gray-300 rounded-lg bg-gray-50"><SignatureCanvas ref={sigPad} penColor='black' canvasProps={{width: 320, height: 150, className: 'sigCanvas mx-auto'}} backgroundColor="#f9fafb" /></div><button type="button" onClick={() => sigPad.current.clear()} className="text-xs text-red-500 underline mt-1">Clear Signature</button></div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-lg flex items-center justify-center">{isSubmitting ? <span>Uploading...</span> : <><CheckCircle className="h-5 w-5 mr-2" /> Mark as Delivered</>}</button>
              </form>
           </div>
        </div>
      )}

      {/* VIEW PROOF MODAL */}
      {viewProofJob && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewProofJob(null)}>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-gray-900 flex items-center"><Package className="h-5 w-5 mr-2 text-blue-600"/> Proof of Delivery</h3>
                 <button onClick={() => setViewProofJob(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
              </div>
              <div className="space-y-4">
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Received By</p><p className="text-lg font-bold text-gray-800">{viewProofJob.pod?.receiver || 'Unknown'}</p></div>
                 {viewProofJob.pod?.photo && <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Photo Evidence</p><img src={viewProofJob.pod.photo} alt="Delivery" className="w-full rounded-lg border border-gray-300" /></div>}
                 {viewProofJob.pod?.signature && <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Signature</p><div className="border border-gray-200 rounded-lg p-2 bg-white"><img src={viewProofJob.pod.signature} alt="Signature" className="w-full h-24 object-contain" /></div></div>}
              </div>
              <div className="mt-4 text-center text-xs text-gray-400">Completed: {viewProofJob.deliveredAt ? new Date(viewProofJob.deliveredAt).toLocaleString() : 'N/A'}</div>
           </div>
        </div>
      )}

      {/* NOTIFICATION MODAL */}
      {showNotification && (
        <>
          {!isMinimized ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 animate-fade-in-up border-l-8 border-yellow-400 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                  <div className="flex items-center text-yellow-600"><AlertCircle className="h-6 w-6 mr-2" /><h3 className="text-lg font-bold text-gray-900">Job Updates</h3></div>
                  <button onClick={() => setIsMinimized(true)} className="p-2 -mr-2 text-gray-400 hover:text-gray-600"><Minimize2 className="h-5 w-5" /></button>
                </div>
                <div className="overflow-y-auto flex-1 pr-1">
                    <p className="text-gray-600 mb-3 text-sm">The following jobs have been modified.</p>
                    <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-4 border border-red-100 font-medium">⚠️ IMPORTANT: Update your Calendar entries manually!</div>
                    <ul className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100 mb-4">
                      {editedJobs.map(job => (
                        <li key={job.id} className="text-sm flex items-start"><span className="h-2 w-2 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span><div className="break-words w-full"><span className="font-semibold block">{job.pickupName}</span><span className="text-gray-400 text-xs">to</span><span className="font-semibold block">{job.dropoffName}</span></div></li>
                      ))}
                    </ul>
                    <div className="flex items-start mb-4 bg-blue-50 p-3 rounded cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                      <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer flex-shrink-0" />
                      <label className="ml-2 text-sm text-blue-800 font-medium cursor-pointer select-none leading-tight">Mark all as read</label>
                    </div>
                </div>
                <div className="flex-shrink-0 pt-2"><button onClick={handleCloseNotification} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-lg">Close Message</button></div>
              </div>
            </div>
          ) : (
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white shadow-2xl rounded-full sm:rounded-lg p-3 sm:p-4 z-50 border-l-0 sm:border-l-4 border-yellow-400 cursor-pointer hover:bg-gray-50 flex items-center gap-3" onClick={() => setIsMinimized(false)}>
              <div className="bg-yellow-100 p-2 rounded-full relative"><Bell className="h-5 w-5 text-yellow-600" /><span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span><span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span></div>
              <div className="hidden sm:block"><p className="font-bold text-gray-800 text-sm">{editedJobs.length} Updates</p></div>
            </div>
          )}
        </>
      )}

      {/* JOBS LIST */}
      {filteredJobs.length === 0 && <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">No {filter !== 'all' ? filter : ''} requests found.</div>}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {filteredJobs.map((job) => {
          const clientInfo = clientMap[job.clientId] || {};
          const clientName = clientInfo.fullName || 'Unknown Client';
          const clientPhone = clientInfo.phone ? `+61 ${clientInfo.phone}` : 'No Phone';
          
          const isRejectedAndReviewed = job.status === 'rejected' && job.hasClientCountered;

          return (
            <div key={job.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${job.status === 'delivered' ? 'opacity-75 bg-slate-50' : ''} ${job.hasUnreadEdit ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
              <div className="bg-slate-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                 <div className="flex items-center text-xs text-slate-500 font-medium"><User className="h-3 w-3 mr-1.5" /><span className="uppercase tracking-wide">Account:</span><span className="ml-2 text-slate-700 font-bold">{clientName}</span><span className="mx-2 text-slate-300">|</span><span className="text-slate-600">{clientPhone}</span></div>
              </div>
              {job.hasUnreadEdit && (
                <div className="bg-yellow-50 text-yellow-800 text-xs font-bold px-4 py-2 flex items-center justify-between border-b border-yellow-100">
                    <span className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> 
                        {isRejectedAndReviewed ? 'CLIENT COUNTERED/ACCEPTED' : 'MODIFIED BY CLIENT'}
                    </span>
                    <button onClick={() => handleMarkAsReviewed(job.id)} className="text-blue-600 hover:text-blue-800 underline transition">Mark as Reviewed</button>
                </div>
              )}
              
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                     <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex flex-wrap items-baseline">${job.totalAmount || job.amount} <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2 capitalize">({job.paymentMethod || 'cash'})</span></h3>
                     <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1"><Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1"/> {job.date ? <span>{job.date} @ {job.hour}:{job.minute} {job.ampm}</span> : <span className="italic text-gray-400">Legacy Data</span>}</div>
                  </div>
                  {job.status === 'pending' ? (
                    <div className="flex gap-2">
                        <button onClick={() => handleStatus(job.id, 'accepted')} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition" title="Accept"><CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                        <button onClick={() => openRejectionModal(job)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition" title="Reject"><XCircle className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                    </div>
                  ) : job.status === 'accepted' ? (
                    <div className="flex flex-col items-end gap-2"><span className="px-3 py-1 text-xs rounded-full font-bold uppercase bg-green-100 text-green-800">Accepted</span><button onClick={() => setDeliveringJobId(job.id)} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-blue-700"><PenTool className="h-3 w-3 mr-1" /> Complete</button></div>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase ${job.status === 'delivered' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-800'}`}>{job.status}</span>
                        {job.status === 'rejected' && job.hasClientCountered && <span className="text-xs text-blue-600 font-bold mt-1">Client Negotiated</span>}
                        {job.status === 'delivered' && <button onClick={() => setViewProofJob(job)} className="flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"><Package className="h-3 w-3 mr-1" /> Proof</button>}
                        {job.status === 'rejected' && (
                             <button onClick={() => openRejectionModal(job)} className="p-2 bg-red-50 text-red-400 rounded-full cursor-not-allowed transition" title="Already Rejected" disabled><XCircle className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                        )}
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                   <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                       <div className="flex-1"><p className="text-xs text-gray-500 uppercase font-bold">Pickup</p><p className="text-sm font-medium">{job.pickupName || 'Unknown'} <span className="text-gray-300 hidden sm:inline">|</span> {job.pickupPhone}</p><p className="text-sm text-gray-600 break-words">{job.from}</p></div>
                       <div className="flex-1 sm:text-right"><p className="text-xs text-gray-500 uppercase font-bold">Dropoff</p><p className="text-sm font-medium">{job.dropoffName || 'Unknown'} <span className="text-gray-300 hidden sm:inline">|</span> {job.dropoffPhone}</p><p className="text-sm text-gray-600 break-words">{job.to}</p></div>
                   </div>
                   {job.purchaseOrder && <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block"><strong>PO:</strong> {job.purchaseOrder}</div>}
                   {job.notes && <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 italic border border-gray-100">"{job.notes}"</div>}
                   
                   {job.status === 'rejected' && job.rejectionDetails && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded text-sm">
                            <p className="text-red-800 font-bold mb-1">Rejection Reason:</p>
                            <p className="text-gray-700">{job.rejectionDetails.reason === 'price' ? 'Price not accepted' : job.rejectionDetails.reason === 'time' ? 'Time not suitable' : 'Other'}</p>
                            {job.rejectionDetails.note && <p className="text-gray-600 italic mt-1">"{job.rejectionDetails.note}"</p>}
                            {job.rejectionDetails.counterPrice && <p className="text-blue-600 font-bold mt-2">Proposed Price: ${job.rejectionDetails.counterPrice}</p>}
                            {job.rejectionDetails.counterTime && <p className="text-blue-600 font-bold mt-2">Proposed Time: {job.rejectionDetails.counterTime.date} @ {job.rejectionDetails.counterTime.hour}:{job.rejectionDetails.counterTime.minute} {job.rejectionDetails.counterTime.ampm}</p>}
                        </div>
                   )}
                </div>
                {job.status === 'accepted' && job.date && (
                  <div className="mt-4 pt-4 border-t border-gray-100"><a href={createGoogleCalendarLink(job)} target="_blank" rel="noreferrer" className="block w-full text-center py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors flex items-center justify-center"><Calendar className="h-4 w-4 mr-2"/> Add to Google Calendar</a></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}