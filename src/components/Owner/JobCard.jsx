import React from 'react';
import { 
    CheckCircle, XCircle, Calendar, AlertCircle, User, PenTool, 
    X, Package, Star, Clock, Truck, Scale
} from 'lucide-react'; 

const getStatusBadge = (status) => {
    switch(status) {
      case 'accepted': return <span className="flex items-center bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><CheckCircle className="h-4 w-4 mr-1"/> Accepted</span>;
      case 'rejected': return <span className="flex items-center bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><XCircle className="h-4 w-4 mr-1"/> Rejected</span>;
      case 'delivered': return <span className="flex items-center bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><Package className="h-4 w-4 mr-1"/> Delivered</span>;
      default: return <span className="flex items-center bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><Clock className="h-4 w-4 mr-1"/> Pending</span>;
    }
};

const createGoogleCalendarLink = (job, clientInfo = {}) => {
    if (!job.date || !job.hour) return "#";
    let hour = parseInt(job.hour);
    if (job.ampm === 'PM' && hour !== 12) hour += 12;
    if (job.ampm === 'AM' && hour === 12) hour = 0;
    const formatTime = (h, m) => `${job.date.replace(/-/g, '')}T${h.toString().padStart(2, '0')}${m}00`;
    const phoneDisplay = clientInfo.phone ? `+61 ${clientInfo.phone}` : 'No Phone';
    const clientName = clientInfo.fullName || 'Unknown';
    
    const title = encodeURIComponent(`Delivery: ${job.from} --> ${job.to}`);
    const details = encodeURIComponent(`CLIENT: ${clientName} (${phoneDisplay})\nDetails: ${job.distanceLabel || ''} / ${job.weightLabel || ''}\nPrice: $${job.totalAmount||job.amount}\nPO: ${job.purchaseOrder||'N/A'}\nNotes: ${job.notes}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${formatTime(hour, job.minute)}/${formatTime(hour + 1, job.minute)}`;
};

export default function JobCard({ job, clientInfo = {}, handleStatus, openRejectionModal, setDeliveringJobId, setViewProofJob, handleMarkAsReviewed }) {
    const clientName = clientInfo.fullName || 'Unknown Client';
    const clientPhone = clientInfo.phone ? `+61 ${clientInfo.phone}` : 'No Phone';

    return (
        <div key={job.id} id={`job-${job.id}`} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${job.status === 'delivered' ? 'opacity-75 bg-slate-50' : ''} ${job.hasUnreadEdit ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
            
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
                    <span className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> 
                        {job.hasClientCountered ? 'CLIENT SUBMITTED COUNTER-OFFER' : 'CLIENT EDITED REQUEST'}
                    </span>
                    <button onClick={() => handleMarkAsReviewed(job.id)} className="text-blue-600 hover:text-blue-800 underline transition">Mark as Reviewed</button>
                </div>
            )}
            
            <div className="p-4 sm:p-5">
                <div className="mb-3">{getStatusBadge(job.status)}</div>
                
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
                            <button onClick={() => openRejectionModal(job)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition" title="Reject"><XCircle className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                        </div>
                    ) : job.status === 'accepted' ? (
                        <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 text-xs rounded-full font-bold uppercase bg-green-100 text-green-800">Accepted</span>
                            <button onClick={() => setDeliveringJobId(job.id)} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-blue-700"><PenTool className="h-3 w-3 mr-1" /> Complete</button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase ${job.status === 'delivered' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-800'}`}>{job.status}</span>
                            {job.status === 'delivered' && <button onClick={() => setViewProofJob(job)} className="flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"><Package className="h-3 w-3 mr-1" /> Proof</button>}
                        </div>
                    )}
                </div>
                
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                            <p className="text-sm font-medium">{job.pickupName || 'Unknown'} <span className="text-gray-300 hidden sm:inline">|</span> {job.pickupPhone}</p>
                            <p className="text-sm text-gray-600 break-words">{job.from}</p>
                        </div>
                        <div className="flex-1 sm:text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold">Dropoff</p>
                            <p className="text-sm font-medium">{job.dropoffName || 'Unknown'} <span className="text-gray-300 hidden sm:inline">|</span> {job.dropoffPhone}</p>
                            <p className="text-sm text-gray-600 break-words">{job.to}</p>
                        </div>
                    </div>
                    
                    {/* NEW: DISPLAY DISTANCE & WEIGHT FOR OWNER */}
                    {job.distanceLabel && job.weightLabel && (
                        <div className="flex gap-3 text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded justify-center sm:justify-start">
                            <span className="flex items-center"><Truck className="h-3 w-3 mr-1 text-slate-500"/> {job.distanceLabel}</span>
                            <span className="flex items-center"><Scale className="h-3 w-3 mr-1 text-slate-500"/> {job.weightLabel}</span>
                        </div>
                    )}

                    {job.purchaseOrder && <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block"><strong>PO:</strong> {job.purchaseOrder}</div>}
                    {job.notes && <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 italic border border-gray-100">"{job.notes}"</div>}
                    
                    {job.status === 'rejected' && job.rejectionDetails && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded text-sm">
                            <p className="text-red-800 font-bold mb-1">Rejection Reason:</p>
                            <p className="text-gray-700">{job.rejectionDetails.reason}</p>
                            {job.rejectionDetails.note && <p className="text-gray-600 italic mt-1">"{job.rejectionDetails.note}"</p>}
                            {job.rejectionDetails.counterPrice && <p className="text-blue-600 font-bold mt-2">Proposed Price: ${job.rejectionDetails.counterPrice}</p>}
                        </div>
                    )}
                    {job.rewardUsed && <div className="mt-3 bg-green-50 text-green-800 text-xs px-2 py-1 rounded inline-block font-bold flex items-center"><Star className="h-3 w-3 mr-1 fill-green-800 text-green-800"/> REWARD CLAIMED</div>}
                </div>
                
                {job.status === 'accepted' && job.date && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <a href={createGoogleCalendarLink(job, clientInfo)} target="_blank" rel="noreferrer" className="block w-full text-center py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors flex items-center justify-center">
                            <Calendar className="h-4 w-4 mr-2"/> Add to Google Calendar
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}