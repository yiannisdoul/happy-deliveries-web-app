import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { CLOUD_NAME, UPLOAD_PRESET, COMPANY_EMAIL } from '../utils/constants'; 
import { calculateTier } from '../utils/tierSystem';
import { sendNotificationEmail, TEMPLATES } from '../utils/emailService'; 

import JobCard from '../components/Owner/JobCard';
import RejectionModal from '../components/Owner/RejectionModal';
import DeliveryModal from '../components/Owner/DeliveryModal';
import ProofViewModal from '../components/Owner/ProofViewModal';
import NotificationSystem from '../components/Owner/NotificationSystem';

export default function OwnerDash() {
  const [jobs, setJobs] = useState([]);
  const [clientMap, setClientMap] = useState({});
  const [filter, setFilter] = useState('all'); 
  const [editedJobs, setEditedJobs] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [deliveringJobId, setDeliveringJobId] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [photoFile, setPhotoFile] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const sigPad = useRef({}); 
  const [viewProofJob, setViewProofJob] = useState(null);
  
  const [rejectingJobId, setRejectingJobId] = useState(null); 
  const [rejectionReason, setRejectionReason] = useState('price');
  const [rejectionNote, setRejectionNote] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDate, setCounterDate] = useState('');
  const [counterHour, setCounterHour] = useState('10');
  const [counterMinute, setCounterMinute] = useState('00');
  const [counterAmpm, setCounterAmpm] = useState('AM');

  const handleMinimize = () => {
      if (editedJobs.length > 0) { setShowNotification(false); setIsMinimized(true); } 
      else { setShowNotification(false); setIsMinimized(false); }
  };
  const handleNavigateToJob = (jobId) => {
      const element = document.getElementById(`job-${jobId}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('animate-ping-once'); 
          setTimeout(() => { element.classList.remove('animate-ping-once'); }, 1500);
          setShowNotification(false); setIsMinimized(true);
      }
  };

  const handleStatus = async (id, newStatus) => {
    try { 
        await updateDoc(doc(db, "requests", id), { status: newStatus, hasUnreadEdit: false }); 
        const job = jobs.find(j => j.id === id);
        if (job && job.clientEmail) {
            const client = clientMap[job.clientId] || {};
            if (newStatus === 'accepted') {
                sendNotificationEmail(TEMPLATES.CLIENT_STATUS_UPDATE, {
                    to_name: client.fullName || job.clientEmail, 
                    to_email: job.clientEmail,
                    subject: "Your Delivery is Booked!",
                    message: `Your request from ${job.from} to ${job.to} on ${job.date} at ${job.hour}:${job.minute} ${job.ampm} has been accepted and scheduled for pickup.`,
                    status: "Accepted",
                    link: "https://dashboard.happydeliveries.com.au/client"
                });
            }
        }
    } 
    catch (e) { console.error(e); }
  };

  const handleMarkAsReviewed = async (jobId) => {
    try { await updateDoc(doc(db, "requests", jobId), { hasUnreadEdit: false }); } 
    catch (e) { alert("Error marking job as reviewed."); console.error(e); }
  };
  const openRejectionModal = (job) => {
      setRejectingJobId(job.id); setCounterPrice(job.totalAmount || job.amount); 
      setCounterDate(job.date); setCounterHour(job.hour); setCounterMinute(job.minute);
      setCounterAmpm(job.ampm);
  };
  
  const uploadToCloudinary = async (file) => {
    const formData = new FormData(); formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Cloudinary Upload failed with status ${res.status}`);
    const data = await res.json(); return data.secure_url;
  };

  const handleLoyaltyStamping = async (clientId, job) => {
      const userRef = doc(db, "users", clientId);
      const userDoc = await getDoc(userRef); 
      const userData = userDoc.data() || {};
      const currentMonthlyCount = (userData.monthly_delivery_count || 0) + 1;
      const updates = { monthly_delivery_count: currentMonthlyCount };

      if (!job.rewardUsed) {
          let currentStamps = userData.stamps || 0;
          let currentRewards = userData.rewardCount || 0;
          const { current: tier } = calculateTier(currentMonthlyCount);
          const maxStampsForUser = tier.slotsNeeded || 10;
          currentStamps += 1;
          if (currentStamps >= maxStampsForUser) {
              currentRewards += 1;
              currentStamps = 0; 
          }
          updates.stamps = currentStamps;
          updates.rewardCount = currentRewards;
      }
      await updateDoc(userRef, updates);
  };

  const handleSubmitDelivery = async (e) => {
    e.preventDefault(); if (!receiverName) return alert("Please enter receiver's name");
    if (sigPad.current.isEmpty()) return alert("Please sign the delivery");
    if (!photoFile) return alert("Please take a photo"); setIsSubmitting(true); let photoURL, sigURL;
    try {
      const job = jobs.find(j => j.id === deliveringJobId); if (!job) throw new Error("Job not found.");
      photoURL = await uploadToCloudinary(photoFile);
      const sigData = sigPad.current.getCanvas().toDataURL('image/png'); const sigBlob = await (await fetch(sigData)).blob();
      sigURL = await uploadToCloudinary(sigBlob);
      
      await updateDoc(doc(db, "requests", deliveringJobId), { status: 'delivered', deliveredAt: new Date().toISOString(), hasUnreadEdit: false, pod: { receiver: receiverName, photo: photoURL, signature: sigURL } });
      
      try { await handleLoyaltyStamping(job.clientId, job); } catch (stampError) { console.error("Loyalty Stamp Failed:", stampError.message); }
      
      if (job.clientEmail) {
          const client = clientMap[job.clientId] || {};
          sendNotificationEmail(TEMPLATES.CLIENT_STATUS_UPDATE, {
              to_name: client.fullName || job.clientEmail,
              to_email: job.clientEmail,
              subject: "Delivery Completed",
              message: `Great news! Your delivery to ${job.to} has been completed. Receiver: ${receiverName}.`,
              status: "Delivered",
              link: "https://dashboard.happydeliveries.com.au/client"
          });
      }

      setDeliveringJobId(null); setReceiverName(''); setPhotoFile(null);
      alert("✅ Job Delivered Successfully & Proof Saved!");
    } catch (error) { console.error("Delivery Error (Fatal):", error); alert(`❌ Delivery Failed: ${error.message}.`); } finally { setIsSubmitting(false); }
  };

  const handleCloseNotification = async () => {
    if (dontShowAgain && editedJobs.length > 0) {
      try { const promises = editedJobs.map(job => updateDoc(doc(db, "requests", job.id), { hasUnreadEdit: false })); await Promise.all(promises); } 
      catch (e) { console.error(e); }
    }
    setShowNotification(false); setDontShowAgain(false); setIsMinimized(false); 
  };
  
  useEffect(() => {
    const q = query(collection(db, "requests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => { const statusOrder = { pending: 1, accepted: 2, delivered: 3, rejected: 4 };
        const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (statusDiff !== 0) return statusDiff; return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }); setJobs(docs);
      const unread = docs.filter(job => job.hasUnreadEdit === true);
      if (unread.length > 0) { setEditedJobs(unread); if (!dontShowAgain) { if (isMinimized) { setShowNotification(false); } else { setShowNotification(true); } } } 
      else { setEditedJobs([]); setShowNotification(false); setIsMinimized(false); }
    });
    return () => unsubscribe();
  }, [isMinimized, dontShowAgain]); 

  useEffect(() => {
    const fetchClients = async () => {
      try { const querySnapshot = await getDocs(collection(db, "users"));
        const map = {}; querySnapshot.forEach((doc) => map[doc.id] = doc.data());
        setClientMap(map);
      } catch (e) { console.error("Error fetching clients:", e); }
    }; fetchClients();
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true; return job.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 relative min-h-screen pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg space-x-1 overflow-x-auto w-full sm:w-auto">
            {['all', 'pending', 'accepted', 'delivered', 'rejected'].map(status => (
                <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-md text-xs font-bold capitalize transition-all whitespace-nowrap ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{status}</button>
            ))}
        </div>
      </div>

      <NotificationSystem
          editedJobs={editedJobs} showNotification={showNotification} isMinimized={isMinimized} 
          setIsMinimized={setIsMinimized} setShowNotification={setShowNotification}
          handleMinimize={handleMinimize} handleNavigateToJob={handleNavigateToJob}
          handleMarkAsReviewed={handleMarkAsReviewed} handleCloseNotification={handleCloseNotification}
          dontShowAgain={dontShowAgain} setDontShowAgain={setDontShowAgain} clientMap={clientMap}
      />

      <RejectionModal 
          rejectingJobId={rejectingJobId} setRejectingJobId={setRejectingJobId}
          rejectionReason={rejectionReason} setRejectionReason={setRejectionReason} rejectionNote={rejectionNote}
          setRejectionNote={setRejectionNote} counterPrice={counterPrice} setCounterPrice={setCounterPrice}
          counterDate={counterDate} setCounterDate={setCounterDate} counterHour={counterHour} setCounterHour={setCounterHour}
          counterMinute={counterMinute} setCounterMinute={setCounterMinute} counterAmpm={counterAmpm} setCounterAmpm={setCounterAmpm}
          isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting}
          clientEmail={jobs.find(j => j.id === rejectingJobId)?.clientEmail}
          clientName={clientMap[jobs.find(j => j.id === rejectingJobId)?.clientId]?.fullName || jobs.find(j => j.id === rejectingJobId)?.clientEmail}
      />
      
      <DeliveryModal
          deliveringJobId={deliveringJobId} setDeliveringJobId={setDeliveringJobId} receiverName={receiverName}
          setReceiverName={setReceiverName} photoFile={photoFile} setPhotoFile={setPhotoFile} isSubmitting={isSubmitting}
          handleSubmitDelivery={handleSubmitDelivery} sigPad={sigPad}
      />
      <ProofViewModal viewProofJob={viewProofJob} setViewProofJob={setViewProofJob} />

      {filteredJobs.length === 0 && <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">No {filter !== 'all' ? filter : ''} requests found.</div>}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} clientInfo={clientMap[job.clientId]} handleStatus={handleStatus}
              openRejectionModal={openRejectionModal} setDeliveringJobId={setDeliveringJobId}
              setViewProofJob={setViewProofJob} handleMarkAsReviewed={handleMarkAsReviewed}
          />
        ))}
      </div>
    </div>
  );
}