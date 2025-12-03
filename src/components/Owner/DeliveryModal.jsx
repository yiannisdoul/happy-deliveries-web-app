import React from 'react';
import { XCircle, CheckCircle, Camera, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function DeliveryModal({
    deliveringJobId, setDeliveringJobId, receiverName, setReceiverName,
    photoFile, setPhotoFile, isSubmitting, handleSubmitDelivery, sigPad
}) {
    if (!deliveringJobId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-blue-900">Complete Delivery</h3>
                 <button onClick={() => setDeliveringJobId(null)} className="text-gray-400 hover:text-gray-600"><XCircle /></button>
              </div>
              <form onSubmit={handleSubmitDelivery} className="space-y-4">
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Receiver Name</label><input required type="text" placeholder="Who accepted the package?" className="w-full border border-gray-300 rounded-lg p-2" value={receiverName} onChange={e => setReceiverName(e.target.value)} /></div>
                 <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Proof Photo</label>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                         <input 
                             type="file" 
                             accept="image/*" 
                             capture="environment" 
                             onChange={e => setPhotoFile(e.target.files[0])} 
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                         <div className="flex flex-col items-center justify-center text-gray-500">
                             {photoFile ? 
                                 <div className="text-green-600 font-bold flex items-center"><CheckCircle className="h-5 w-5 mr-1"/> Photo Selected</div> : 
                                 <><Camera className="h-8 w-8 mb-1" /><span className="text-sm">Tap to take photo</span></>
                             }
                         </div>
                     </div>
                 </div>
                 <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Signature</label>
                     <div className="border border-gray-300 rounded-lg bg-gray-50">
                         <SignatureCanvas 
                             ref={sigPad} 
                             penColor='black' 
                             canvasProps={{width: 320, height: 150, className: 'sigCanvas mx-auto'}} 
                             backgroundColor="#f9fafb" 
                         />
                     </div>
                     <button type="button" onClick={() => sigPad.current.clear()} className="text-xs text-red-500 underline mt-1">Clear Signature</button>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-lg flex items-center justify-center">
                     {isSubmitting ? <span>Uploading...</span> : <><CheckCircle className="h-5 w-5 mr-2" /> Mark as Delivered</>}
                 </button>
              </form>
           </div>
        </div>
    );
}