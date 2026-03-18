import React from 'react';
import { 
    MapPin, FileText, CheckCircle, XCircle, Clock, 
    Edit2, AlertTriangle, Package, Truck, Scale
} from 'lucide-react'; 

const getStatusBadge = (status) => {
    switch(status) {
      case 'accepted': return <span className="flex items-center bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><CheckCircle className="h-4 w-4 mr-1"/> Accepted</span>;
      case 'rejected': return <span className="flex items-center bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><XCircle className="h-4 w-4 mr-1"/> Rejected</span>;
      case 'delivered': return <span className="flex items-center bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><Package className="h-4 w-4 mr-1"/> Delivered</span>;
      case 'cancelled': return <span className="flex items-center bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase"><XCircle className="h-4 w-4 mr-1"/> Cancelled</span>;
      default: return <span className="flex items-center bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><Clock className="h-4 w-4 mr-1"/> Pending</span>;
    }
};

export default function ClientJobCard({ job, openCounterModal, handleAcceptCounter, setViewProofJob, handleEdit, handleCancelJob }) {
    
    const canEdit = job.status === 'pending';
    const canCounter = job.status === 'rejected' && !job.hasClientCountered;
    const canCancel = job.status === 'pending' || job.status === 'accepted';

    return (
        <div key={job.id} className="bg-white shadow-sm rounded-lg p-5 border border-gray-100 relative hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                <div>{getStatusBadge(job.status)}</div>
                <p className="text-sm font-bold text-gray-800 flex items-center"><Clock className="h-3 w-3 mr-1 text-gray-400"/>{job.date ? <span>{job.date} @ {job.hour}:{job.minute} {job.ampm}</span> : <span>Undated</span>}</p>
            </div>
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center"><MapPin className="h-3 w-3 mr-1 text-blue-400"/> <span className="font-semibold text-gray-700 w-12">From:</span> {job.from}</p>
                    <p className="text-sm text-gray-600 flex items-center"><MapPin className="h-3 w-3 mr-1 text-orange-400"/> <span className="font-semibold text-gray-700 w-12">To:</span> {job.to}</p>
                    
                    {job.distanceLabel && job.weightLabel && (
                        <div className="flex gap-2 my-2">
                            <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-100 flex items-center">
                                <Truck className="h-3 w-3 mr-1"/> {job.distanceLabel}
                            </span>
                            <span className="text-xs bg-purple-50 text-purple-800 px-2 py-1 rounded border border-purple-100 flex items-center">
                                <Scale className="h-3 w-3 mr-1"/> {job.weightLabel}
                            </span>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 flex items-center"><FileText className="h-3 w-3 mr-1"/> PO: <span className="font-medium ml-1">{job.purchaseOrder || 'N/A'}</span></p>
                    
                    {/* NEW: Display Receipt Link and Optional Notes */}
                    {job.receiptUrl && (
                        <a href={job.receiptUrl} target="_blank" rel="noreferrer" className="mt-2 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded inline-flex items-center font-bold border border-indigo-200 transition">
                            <FileText className="h-3 w-3 mr-1"/> View Receipt
                        </a>
                    )}
                    
                    {job.notes && <div className="mt-2 bg-gray-50 px-2 py-1 rounded inline-block"><p className="text-xs text-gray-600">Instructions: <span className="italic">{job.notes}</span></p></div>}
                    
                    {job.status === 'cancelled' && job.isLateCancel && (
                        <div className="mt-3 bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-2 rounded inline-block font-bold">
                            <AlertTriangle className="h-3 w-3 inline mr-1 mb-0.5"/> 
                            25% LATE CANCELLATION FEE APPLIED: ${job.cancellationFee?.toFixed(2)}
                        </div>
                    )}

                    {job.status === 'rejected' && job.rejectionDetails && (
                        <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-gray-700">
                            <p className="font-bold text-red-800 mb-1 flex items-center"><AlertTriangle className="h-4 w-4 mr-1"/> Request Rejected</p>
                            <p><span className="font-semibold">Reason:</span> {job.rejectionDetails.reason === 'price' ? 'Price too low' : job.rejectionDetails.reason === 'time' ? 'Time conflict' : 'Other'}</p>
                            {job.rejectionDetails.note && <p className="italic text-gray-600 mt-1">"{job.rejectionDetails.note}"</p>}
                            
                            {(job.rejectionDetails.counterPrice || job.rejectionDetails.counterTime) && (
                                <div className="mt-3 bg-white p-2 rounded border border-gray-200 flex justify-between items-center flex-wrap">
                                    {job.rejectionDetails.counterPrice && <span className="font-bold text-blue-600 mr-2 block w-full sm:w-auto">Owner Proposes: ${job.rejectionDetails.counterPrice}</span>}
                                    {job.rejectionDetails.counterTime && <span className="font-bold text-blue-600 text-xs mr-2 block w-full sm:w-auto">Owner Proposes: {job.rejectionDetails.counterTime.date} @ {job.rejectionDetails.counterTime.hour}:{job.rejectionDetails.counterTime.minute} {job.rejectionDetails.counterTime.ampm}</span>}
                                    
                                    {canCounter && (
                                    <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 w-full sm:w-auto items-end">
                                            <button onClick={() => handleAcceptCounter(job)} className="bg-green-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-green-700 w-full sm:w-auto">Accept Offer</button>
                                            <div className="text-center w-full sm:w-auto">
                                                <button onClick={() => openCounterModal(job)} className="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-blue-700 w-full sm:w-auto">Counter</button> 
                                                <span className="text-[9px] text-red-600 block mt-0.5 font-bold uppercase tracking-tight">(1 attempt only)</span>
                                            </div>
                                    </div>
                                    )}
                                    {!canCounter && job.hasClientCountered && <span className="text-xs font-bold text-green-700">Counter offer accepted or re-submitted.</span>}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {job.rewardUsed && <div className="mt-3 bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded inline-block font-bold">LOYALTY REWARD CLAIMED</div>}
                </div>
                
                <div className="text-right flex flex-col items-end">
                    <p className={`font-bold text-2xl ${job.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-blue-600'}`}>${job.totalAmount || job.amount}</p>
                    <p className="text-xs text-gray-400 capitalize mb-2">{job.paymentMethod}</p>
                    
                    <div className="flex gap-2 mt-2">
                        {job.status === 'delivered' ? (
                            <button onClick={() => setViewProofJob(job)} className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1.5 rounded-full font-bold flex items-center transition-colors"><Package className="h-3 w-3 mr-1"/> View Proof</button>
                        ) : (
                            canEdit && (
                                <button 
                                    onClick={() => handleEdit(job)} 
                                    className={`text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold flex items-center transition-colors hover:bg-blue-100`}
                                    title="Edit request"
                                >
                                    <Edit2 className="h-3 w-3 mr-1"/> Edit
                                </button>
                            )
                        )}
                        
                        {canCancel && (
                            <button 
                                onClick={() => handleCancelJob(job)} 
                                className={`text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold flex items-center transition-colors hover:bg-red-100`}
                                title="Cancel request"
                            >
                                <XCircle className="h-3 w-3 mr-1"/> Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}