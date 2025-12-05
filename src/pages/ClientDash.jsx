import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { REWARD_VALUE } from '../utils/constants';

// IMPORT NEW COMPONENTS
import LoyaltyCard from '../components/Client/LoyaltyCard';
import RequestForm from '../components/Client/RequestForm';
import ClientJobCard from '../components/Client/JobCard';
import ProofViewModal from '../components/Client/ProofViewModal';
import CounterOfferModal from '../components/Client/CounterOfferModal';

// --- HELPER: Get Tomorrow's Date for Default State ---
// This prevents "Time in past" errors on load, ensuring the Quote box is visible.
const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function ClientDash() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all'); 
  const [editingId, setEditingId] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [viewProofJob, setViewProofJob] = useState(null);
  
  // --- LOYALTY STATE ---
  const [stamps, setStamps] = useState(0); 
  const [rewardCount, setRewardCount] = useState(0); 
  const [useRewardOnThisJob, setUseRewardOnThisJob] = useState(false); 
  // ---------------------

  // --- COUNTER MODAL STATE ---
  const [counteringJob, setCounteringJob] = useState(null); 
  const [counterNote, setCounterNote] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDate, setCounterDate] = useState('');
  const [counterHour, setCounterHour] = useState('10');
  const [counterMinute, setCounterMinute] = useState('00');
  const [counterAmpm, setCounterAmpm] = useState('AM');
  // -----------------------------

  const [formData, setFormData] = useState({
    pickupName: '', pickupPhone: '', from: '',
    dropoffName: '', dropoffPhone: '', to: '',
    notes: '', amount: '', paymentMethod: 'cash',
    
    // UPDATED: Default to Tomorrow
    date: getTomorrowDate(),
    
    hour: '10', minute: '00', ampm: 'AM',
    acceptSurcharge: false,
    purchaseOrder: '', poType: 'entry'    
  });

  // =======================================================
  // DATA FETCHING AND FILTERING
  // =======================================================
  
  useEffect(() => {
    let unsubscribeSnapshot = () => {};
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
            const userData = userDoc.data() || {};
            setStamps(userData.stamps || 0);
            setRewardCount(userData.rewardCount || 0); 
        });

        const q = query(collection(db, "requests"), where("clientEmail", "==", user.email));
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setJobs(docs);
        });
        
        return () => { unsubscribeUser(); unsubscribeSnapshot(); };
      } else {
        setJobs([]); setStamps(0); setRewardCount(0); setUseRewardOnThisJob(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  // =======================================================
  // UTILITY & BUSINESS LOGIC FUNCTIONS
  // =======================================================

  const getTimeValidation = () => {
    let hour24 = parseInt(formData.hour);
    if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;
    const [year, month, day] = formData.date.split('-').map(Number);
    const bookingTime = new Date(year, month - 1, day, hour24, parseInt(formData.minute));
    const now = new Date();
    const diffMs = bookingTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffMs < 0) return { isValid: false, error: "Time cannot be in the past." };
    if (diffHours < 2) return { isValid: false, error: "Too Soon: We require at least 2 hours notice." };
    if (hour24 >= 18 || hour24 < 7) return { isValid: false, error: "Closed: We operate between 7:00 AM and 6:00 PM." };
    return { isValid: true, error: null };
  };

  const calculateTotal = () => {
    const base = parseFloat(formData.amount) || 0;
    const isToday = new Date(formData.date).toDateString() === new Date().toDateString();
    let hour24 = parseInt(formData.hour);
    if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;
    const isLate = isToday && hour24 >= 14; 
    
    let subtotal = base;
    let surcharge = 0;
    let discount = 0;

    if (isLate) { surcharge = base * 0.5; subtotal += surcharge; }
    
    if (useRewardOnThisJob && rewardCount > 0) {
        discount = Math.min(subtotal, REWARD_VALUE);
        subtotal = subtotal - discount;
    }

    return { total: subtotal, subtotal: subtotal, surcharge: surcharge, isLate: isLate, discount: discount };
  };
  
  const { total, subtotal, surcharge, isLate, discount } = calculateTotal();
  const timeStatus = getTimeValidation();

  const handlePhoneInput = (val, field) => {
    const numericOnly = val.replace(/\D/g, '');
    if (numericOnly.length <= 9) setFormData(prev => ({ ...prev, [field]: numericOnly }));
  };

  const handleEdit = (job) => {
     setEditingId(job.id);
     const isNA = job.purchaseOrder === 'N/A';
     setFormData({
       ...job, paymentMethod: job.paymentMethod || 'cash',
       acceptSurcharge: job.totalAmount > job.amount, 
       poType: isNA ? 'na' : 'entry',
       purchaseOrder: isNA ? '' : job.purchaseOrder
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const openCounterModal = (job) => {
    setCounteringJob(job);
    const rejection = job.rejectionDetails || {};
    setCounterNote(rejection.note || job.notes || '');
    setCounterPrice(rejection.counterPrice || job.amount);
    setCounterDate(rejection.counterTime?.date || job.date);
    setCounterHour(rejection.counterTime?.hour || job.hour);
    setCounterMinute(rejection.counterTime?.minute || job.minute);
    setCounterAmpm(rejection.counterTime?.ampm || job.ampm);
  };
  
  const handleSubmitCounterModal = async (e) => {
    e.preventDefault();
    
    if (counteringJob.rejectionDetails?.reason === 'price' && !counterPrice) {
        return alert("Please enter a new price for your counter-offer.");
    }
    if (counteringJob.rejectionDetails?.reason === 'time') {
        if (!counterDate || !counterHour || !counterMinute) {
             return alert("Please select a new date and time for your counter-offer.");
        }
    }
    
    if (!confirm("Are you sure you want to send this counter-offer? This is your final chance to modify the request after rejection.")) {
        return;
    }
    
    const job = counteringJob;
    
    let updatedAmount = job.amount;
    let updatedTotalAmount = job.totalAmount;
    let updatedDate = job.date;
    let updatedHour = job.hour;
    let updatedMinute = job.minute;
    let updatedAmpm = job.ampm;
    
    if (job.rejectionDetails?.reason === 'price') {
        const newPrice = parseFloat(counterPrice);
        updatedAmount = newPrice;
        updatedTotalAmount = newPrice; 
    }
    if (job.rejectionDetails?.reason === 'time') {
        updatedDate = counterDate;
        updatedHour = counterHour;
        updatedMinute = counterMinute;
        updatedAmpm = counterAmpm;
    }
    
    const payload = {
        amount: updatedAmount,
        totalAmount: updatedTotalAmount,
        date: updatedDate,
        hour: updatedHour,
        minute: updatedMinute,
        ampm: updatedAmpm,
        notes: counterNote, 

        status: 'pending', 
        hasUnreadEdit: true,
        hasClientCountered: true, 
        rejectionDetails: null, 
        updatedAt: serverTimestamp(),

        pickupName: job.pickupName,
        pickupPhone: job.pickupPhone,
        from: job.from,
        dropoffName: job.dropoffName,
        dropoffPhone: job.dropoffPhone,
        to: job.to,
        paymentMethod: job.paymentMethod || 'cash',
        purchaseOrder: job.purchaseOrder, 
    };
    
    try {
        await updateDoc(doc(db, "requests", job.id), payload);
        alert("Counter Offer Sent! The request is now pending the Owner's review.");
    } catch (e) {
        alert("Error sending counter offer: " + e.message);
        console.error(e);
    } finally {
        setCounteringJob(null);
    }
};

  const handleAcceptCounter = async (job) => {
      if (!confirm("Are you sure you want to accept the new terms?")) return;
      const updates = { 
          status: 'accepted', hasUnreadEdit: true, 
          hasClientCountered: true, rejectionDetails: null 
      };

      if (job.rejectionDetails?.counterPrice) {
          const counterPrice = parseFloat(job.rejectionDetails.counterPrice);
          updates.amount = counterPrice; updates.totalAmount = counterPrice; 
      }
      if (job.rejectionDetails?.counterTime) {
          const t = job.rejectionDetails.counterTime;
          updates.date = t.date; updates.hour = t.hour; updates.minute = t.minute; updates.ampm = t.ampm;
      }
      updates.paymentMethod = job.paymentMethod || 'cash'; updates.acceptSurcharge = false; 

      try { await updateDoc(doc(db, "requests", job.id), updates); alert("Offer Accepted! Job is now active."); } 
      catch { alert("Error accepting offer."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.pickupPhone.length < 9) return alert("Pickup Phone must be 9 digits.");
    if (formData.dropoffPhone.length < 9) return alert("Dropoff Phone must be 9 digits.");
    if (!timeStatus.isValid) return alert(`Cannot submit: ${timeStatus.error}`);
    if (isLate && !formData.acceptSurcharge) return alert("For same-day delivery after 2 PM, you must accept the surcharge.");
    if (formData.poType === 'entry' && !formData.purchaseOrder.trim()) return alert("Please enter a Purchase Order number or select N/A.");
    if (useRewardOnThisJob && discount === 0 && parseFloat(formData.amount) > 0) {
        return alert("Reward is selected, but discount is $0. Ensure you have entered an Offer Amount.");
    }

    setLoading(true);
    try {
      const finalPO = formData.poType === 'na' ? "N/A" : formData.purchaseOrder;
      const payload = {
        ...formData, purchaseOrder: finalPO, amount: parseFloat(formData.amount),
        surcharge: surcharge, totalAmount: total, clientEmail: auth.currentUser.email,
        clientId: auth.currentUser.uid, status: 'pending', updatedAt: serverTimestamp(),
        rewardUsed: useRewardOnThisJob && discount > 0,
      };
      delete payload.poType; 

      if (!editingId) {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "requests"), payload);
        alert(`Request Sent! Total: $${total.toFixed(2)}.`);
        
        if (payload.rewardUsed) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { rewardCount: rewardCount - 1 });
            setUseRewardOnThisJob(false); 
            alert(`Reward claimed! $${discount.toFixed(2)} discount applied. One banked delivery used.`);
        }
      } else {
        payload.hasUnreadEdit = true;
        const jobToEdit = jobs.find(j => j.id === editingId);
        if (jobToEdit && jobToEdit.status === 'rejected' && !jobToEdit.hasClientCountered) {
            payload.hasClientCountered = true; payload.rejectionDetails = null; 
        }
        await updateDoc(doc(db, "requests", editingId), payload);
        alert("Request Updated!"); setEditingId(null);
      }
      
      // RESET FORM - Reset Date to Tomorrow as well
      setFormData({ pickupName: '', pickupPhone: '', from: '', dropoffName: '', dropoffPhone: '', to: '',
        notes: '', amount: '', paymentMethod: 'cash', 
        date: getTomorrowDate(),
        hour: '10', minute: '00', ampm: 'AM', acceptSurcharge: false, purchaseOrder: '', poType: 'entry'
      });
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };


  // =======================================================
  // RENDERING
  // =======================================================

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      <ProofViewModal
          viewProofJob={viewProofJob}
          setViewProofJob={setViewProofJob}
      />
      
      {/* COUNTER MODAL */}
      <CounterOfferModal
          counteringJob={counteringJob}
          setCounteringJob={setCounteringJob}
          handleSubmitCounterModal={handleSubmitCounterModal}
          counterNote={counterNote} setCounterNote={setCounterNote}
          counterPrice={counterPrice} setCounterPrice={setCounterPrice}
          counterDate={counterDate} setCounterDate={setCounterDate}
          counterHour={counterHour} setCounterHour={counterHour}
          counterMinute={counterMinute} setCounterMinute={setCounterMinute}
          counterAmpm={counterAmpm} setCounterAmpm={counterAmpm}
      />

      <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8 gap-8">
        
        {/* FORM SECTION */}
        <div className="md:col-span-1 order-1">
          <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-100"> 
            
            <div id="loyalty-card-target">
              <LoyaltyCard 
                  stamps={stamps}
                  rewardCount={rewardCount}
                  useRewardOnThisJob={useRewardOnThisJob}
                  setUseRewardOnThisJob={setUseRewardOnThisJob}
              />
            </div>
            
            <div id="request-form-target">
              <RequestForm
                  formData={formData}
                  setFormData={setFormData}
                  handleSubmit={handleSubmit}
                  handlePhoneInput={handlePhoneInput}
                  timeStatus={timeStatus}
                  isLate={isLate}
                  total={total}
                  subtotal={subtotal}
                  discount={discount}
                  editingId={editingId}
                  loading={loading}
              />
            </div>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="md:col-span-2 order-2 space-y-4" id="jobs-list-target">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
             <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">My Requests ({jobs.length})</h3>
             <div className="flex bg-gray-100 p-1 rounded-lg space-x-1" id="jobs-filter-target">
                {['all', 'pending', 'accepted', 'delivered', 'rejected'].map(status => (
                    <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{status}</button>
                ))}
             </div>
          </div>
          
          {filteredJobs.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><p className="text-gray-500">No {filter !== 'all' ? filter : ''} requests found.</p></div>}

          <div className="space-y-4">
            {filteredJobs.map((job) => (
                <ClientJobCard
                    key={job.id}
                    job={job}
                    openCounterModal={openCounterModal} 
                    handleAcceptCounter={handleAcceptCounter}
                    setViewProofJob={setViewProofJob}
                    handleEdit={handleEdit} 
                />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}