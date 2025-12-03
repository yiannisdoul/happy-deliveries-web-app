import React from 'react';
import { Package, X } from 'lucide-react'; 

export default function ProofViewModal({ viewProofJob, setViewProofJob }) {
    if (!viewProofJob) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewProofJob(null)}>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                 <h3 className="text-lg font-bold text-gray-900 flex items-center"><Package className="h-5 w-5 mr-2 text-blue-600"/> Proof of Delivery</h3>
                 <button onClick={() => setViewProofJob(null)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                 <div><label className="text-xs font-bold text-gray-500 uppercase">Received By</label><p className="text-xl font-bold text-gray-800">{viewProofJob.pod?.receiver || 'Unknown'}</p></div>
                 {viewProofJob.pod?.photo && <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Photo Evidence</label><div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"><img src={viewProofJob.pod.photo} alt="Delivery" className="w-full object-cover" /></div></div>}
                 {viewProofJob.pod?.signature && <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Signature</label><div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-center"><img src={viewProofJob.pod.signature} alt="Signature" className="h-24 object-contain" /></div></div>}
              </div>
              <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">Delivered at: {viewProofJob.deliveredAt ? new Date(viewProofJob.deliveredAt).toLocaleString() : 'N/A'}</div>
           </div>
        </div>
    );
}