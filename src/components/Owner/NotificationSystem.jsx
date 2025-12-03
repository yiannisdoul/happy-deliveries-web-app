import React from 'react';
import { Bell, Minimize2, AlertCircle, ArrowRight } from 'lucide-react'; 
import { getNotificationMessage } from '../../utils/constants';

export default function NotificationSystem({
    editedJobs, showNotification, isMinimized, setIsMinimized, setShowNotification,
    handleMinimize, handleNavigateToJob, handleMarkAsReviewed, handleCloseNotification,
    dontShowAgain, setDontShowAgain, clientMap
}) {
    // Only render the minimized icon or the full modal if there are edits
    if (editedJobs.length === 0) return null;
    
    const restoreFullModal = () => {
        setIsMinimized(false);
        setShowNotification(true);
    };

    return (
        <>
            {/* NEW: PERSISTENT UPDATES TAB / LIST */}
            <div className="bg-white shadow-lg rounded-xl p-5 mb-6 border border-yellow-300">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-yellow-600 animate-pulse"/> Pending Updates ({editedJobs.length})
                    <span className="text-xs font-normal text-gray-500 ml-3">Click to view details.</span>
                </h3>
                <div className="space-y-3">
                    {editedJobs.slice(0, 5).map(job => (
                        <div 
                            key={job.id} 
                            id={`update-tab-${job.id}`}
                            onClick={() => handleNavigateToJob(job.id)}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-yellow-50 transition"
                        >
                            <div className="text-sm font-medium">
                                <span className="text-gray-700">{clientMap[job.clientId]?.fullName || 'Unknown'}</span>: 
                                <span className="text-yellow-800 font-semibold ml-2">{getNotificationMessage(job)}</span>
                            </div>
                            <span className="text-xs text-blue-600 hover:underline flex items-center">
                                View Job <ArrowRight className="h-3 w-3 ml-1" />
                            </span>
                        </div>
                    ))}
                    {editedJobs.length > 5 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">... and {editedJobs.length - 5} more updates.</p>
                    )}
                </div>
            </div>

            {/* FULL NOTIFICATION MODAL */}
            {showNotification && !isMinimized && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 animate-fade-in-up border-l-8 border-yellow-400 max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-start mb-4 flex-shrink-0">
                            <div className="flex items-center text-yellow-600"><AlertCircle className="h-6 w-6 mr-2" /><h3 className="text-lg font-bold text-gray-900">Job Updates ({editedJobs.length})</h3></div>
                            <button onClick={handleMinimize} className="p-2 -mr-2 text-gray-400 hover:text-gray-600" title="Minimize Message"><Minimize2 className="h-5 w-5" /></button> 
                        </div>
                        <div className="overflow-y-auto flex-1 pr-1">
                            <p className="text-gray-600 mb-3 text-sm">The following jobs have been modified.</p>
                            <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-4 border border-red-100 font-medium">⚠️ IMPORTANT: Update your Calendar entries manually!</div>
                            
                            <ul className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100 mb-4">
                            {editedJobs.map(job => (
                                <li key={job.id} className="text-sm flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-start">
                                        <span className="h-2 w-2 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                        <div className="break-words w-full">
                                            <span className="font-semibold block">{job.pickupName} <ArrowRight className="h-3 w-3 inline text-gray-400 mx-1"/> {job.dropoffName}</span>
                                            <span className="text-gray-500 text-xs font-medium">{getNotificationMessage(job)}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleMarkAsReviewed(job.id)}
                                        className="text-xs text-blue-600 underline hover:text-blue-800 ml-2 flex-shrink-0 whitespace-nowrap"
                                    >
                                        Mark as Read
                                    </button>
                                </li>
                            ))}
                            </ul>
                            
                            <div className="flex items-start mb-4 bg-blue-50 p-3 rounded cursor-pointer" onClick={() => setDontShowAgain(prev => !prev)}>
                                <input type="checkbox" checked={dontShowAgain} onChange={() => setDontShowAgain(prev => !prev)} className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer flex-shrink-0" />
                                <label className="ml-2 text-sm text-blue-800 font-medium cursor-pointer select-none leading-tight">Mark all as read when closing</label>
                            </div>
                        </div>
                        <div className="flex-shrink-0 pt-2">
                            <button onClick={handleCloseNotification} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-lg">Close & Dismiss</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MINIMIZED BELL ICON VIEW (Bottom Right) */}
            {isMinimized && editedJobs.length > 0 && (
                <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white shadow-2xl rounded-full sm:rounded-lg p-3 sm:p-4 z-50 border-l-0 sm:border-l-4 border-yellow-400 cursor-pointer hover:bg-gray-50 flex items-center gap-3" onClick={restoreFullModal}> 
                    <div className="bg-yellow-100 p-2 rounded-full relative"><Bell className="h-5 w-5 text-yellow-600" /><span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span><span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span></div>
                    <div className="hidden sm:block"><p className="font-bold text-gray-800 text-sm">{editedJobs.length} Updates</p></div>
                </div>
            )}
        </>
    );
}