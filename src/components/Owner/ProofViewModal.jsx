import React from 'react';
import { Package, X } from 'lucide-react'; 

export default function ProofViewModal({ viewProofJob, setViewProofJob }) {
    if (!viewProofJob) return null;

    return (
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
    );
}