import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar, AlertCircle, Bell, Minimize2, User } from 'lucide-react'; 
import { db } from '../config/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';

export default function OwnerDash() {
  const [jobs, setJobs] = useState([]);
  const [clientMap, setClientMap] = useState({});
  
  const [editedJobs, setEditedJobs] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "requests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      docs.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setJobs(docs);

      const unread = docs.filter(job => job.hasUnreadEdit === true);
      if (unread.length > 0) {
        setEditedJobs(unread);
        setShowNotification(true);
        setIsMinimized(false); 
      } else {
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
        querySnapshot.forEach((doc) => {
          map[doc.id] = doc.data();
        });
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

  const handleCloseNotification = async () => {
    if (dontShowAgain) {
      try {
        const promises = editedJobs.map(job => 
          updateDoc(doc(db, "requests", job.id), { hasUnreadEdit: false })
        );
        await Promise.all(promises);
      } catch (e) {
        console.error("Error clearing notifications:", e);
      }
    }
    setShowNotification(false);
  };

  const createGoogleCalendarLink = (job) => {
    if (!job.date || !job.hour) return "#";
    let hour = parseInt(job.hour);
    if (job.ampm === 'PM' && hour !== 12) hour += 12;
    if (job.ampm === 'AM' && hour === 12) hour = 0;
    
    const formatTime = (h, m) => `${job.date.replace(/-/g, '')}T${h.toString().padStart(2, '0')}${m}00`;
    
    // Retrieve Client Details for Calendar
    const client = clientMap[job.clientId] || {};
    // FIX: Add +61 to the calendar description as well
    const phoneDisplay = client.phone ? `+61 ${client.phone}` : 'No Phone';
    const clientInfo = `${client.fullName || 'Unknown'} (${phoneDisplay})`;

    const title = encodeURIComponent(`Delivery: ${job.from} --> ${job.to}`);
    
    const detailsText = [
      `CLIENT ACCOUNT: ${clientInfo}`,
      `PRICE: $${job.totalAmount || job.amount} (${job.paymentMethod})`,
      `PO NUMBER: ${job.purchaseOrder || 'N/A'}`,
      `-------------------`,
      `PICKUP:`,
      `Name: ${job.pickupName}`,
      `Phone: ${job.pickupPhone}`,
      `Address: ${job.from}`,
      `-------------------`,
      `DROPOFF:`,
      `Name: ${job.dropoffName}`,
      `Phone: ${job.dropoffPhone}`,
      `Address: ${job.to}`,
      `-------------------`,
      `NOTES: ${job.notes}`
    ].join('\n');

    const details = encodeURIComponent(detailsText);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${formatTime(hour, job.minute)}/${formatTime(hour + 1, job.minute)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 relative min-h-screen pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Owner Dashboard</h1>
      
      {showNotification && (
        <>
          {!isMinimized ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 animate-fade-in-up border-l-8 border-yellow-400 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <h3 className="text-lg font-bold text-gray-900">Job Updates</h3>
                  </div>
                  <button onClick={() => setIsMinimized(true)} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
                    <Minimize2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 pr-1">
                    <p className="text-gray-600 mb-3 text-sm">The following accepted jobs have been modified by the client.</p>
                    <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-4 border border-red-100 font-medium">⚠️ IMPORTANT: Update your Calendar entries manually!</div>
                    <ul className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100 mb-4">
                      {editedJobs.map(job => (
                        <li key={job.id} className="text-sm flex items-start">
                          <span className="h-2 w-2 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <div className="break-words w-full">
                            <span className="font-semibold block">{job.pickupName || 'Unknown'}</span> 
                            <span className="text-gray-400 text-xs">to</span>
                            <span className="font-semibold block">{job.dropoffName}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-start mb-4 bg-blue-50 p-3 rounded cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                      <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer flex-shrink-0" />
                      <label className="ml-2 text-sm text-blue-800 font-medium cursor-pointer select-none leading-tight">Mark as read (Remove notification)</label>
                    </div>
                </div>
                <div className="flex-shrink-0 pt-2">
                    <button onClick={handleCloseNotification} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-lg active:scale-95">Close Message</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white shadow-2xl rounded-full sm:rounded-lg p-3 sm:p-4 z-50 border-l-0 sm:border-l-4 border-yellow-400 cursor-pointer hover:bg-gray-50 transition-transform transform active:scale-95 flex items-center gap-3" onClick={() => setIsMinimized(false)}>
              <div className="bg-yellow-100 p-2 rounded-full relative">
                <Bell className="h-5 w-5 text-yellow-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-gray-800 text-sm">{editedJobs.length} Updates</p>
                <p className="text-xs text-gray-500">Click to expand</p>
              </div>
            </div>
          )}
        </>
      )}

      {jobs.length === 0 && <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">No requests found.</div>}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {jobs.map((job) => {
          // --- LOOKUP CLIENT INFO ---
          const clientInfo = clientMap[job.clientId] || {};
          const clientName = clientInfo.fullName || 'Unknown Client';
          // FIX: Add +61 prefix directly here for display
          const clientPhone = clientInfo.phone ? `+61 ${clientInfo.phone}` : 'No Phone';

          return (
            <div key={job.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${job.hasUnreadEdit ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
              
              {/* --- CLIENT ACCOUNT HEADER --- */}
              <div className="bg-slate-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                 <div className="flex items-center text-xs text-slate-500 font-medium">
                    <User className="h-3 w-3 mr-1.5" />
                    <span className="uppercase tracking-wide">Account:</span>
                    <span className="ml-2 text-slate-700 font-bold">{clientName}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-600">{clientPhone}</span>
                 </div>
              </div>

              {job.hasUnreadEdit && (
                 <div className="bg-yellow-50 text-yellow-800 text-xs font-bold px-4 py-2 flex items-center justify-between border-b border-yellow-100">
                   <span className="flex items-center"><AlertCircle className="h-3 w-3 mr-1" /> MODIFIED BY CLIENT</span>
                 </div>
              )}
              
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                     <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex flex-wrap items-baseline">
                       ${job.totalAmount || job.amount} <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2 capitalize">({job.paymentMethod || 'cash'})</span>
                     </h3>
                     <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1"/> 
                        {job.date ? <span>{job.date} @ {job.hour}:{job.minute} {job.ampm}</span> : <span className="italic text-gray-400">Legacy Data</span>}
                     </div>
                  </div>
                  {job.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatus(job.id, 'accepted')} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition" title="Accept"><CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                      <button onClick={() => handleStatus(job.id, 'rejected')} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition" title="Reject"><XCircle className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                    </div>
                  ) : (
                      <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wide ${job.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{job.status}</span>
                  )}
                </div>
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                   <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                       <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                          <p className="text-sm font-medium">{job.pickupName || 'Unknown'} <span className="text-gray-300 hidden sm:inline">|</span> <span className="block sm:inline text-gray-500">{job.pickupPhone || 'N/A'}</span></p>
                          <p className="text-sm text-gray-600 break-words">{job.from}</p>
                       </div>
                       <div className="flex-1 sm:text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold">Dropoff</p>
                          <p className="text-sm font-medium">{job.dropoffName || 'Unknown'} <span className="text-gray-300 hidden sm:inline">|</span> <span className="block sm:inline text-gray-500">{job.dropoffPhone || 'N/A'}</span></p>
                          <p className="text-sm text-gray-600 break-words">{job.to}</p>
                       </div>
                   </div>
                   {job.purchaseOrder && (
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                          <strong>PO:</strong> {job.purchaseOrder}
                      </div>
                   )}
                   {job.notes && <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 italic border border-gray-100">"{job.notes}"</div>}
                </div>
                {job.status === 'accepted' && job.date && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                     <a href={createGoogleCalendarLink(job)} target="_blank" rel="noreferrer" className="block w-full text-center py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors flex items-center justify-center"><Calendar className="h-4 w-4 mr-2"/> Add to Google Calendar</a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}