import React, { useState, useEffect } from 'react';
import { 
    MapPin, DollarSign, FileText, CheckCircle, XCircle, Clock, 
    Edit2, AlertTriangle, Package, X, ArrowRight, Star, Heart 
} from 'lucide-react'; 
import { db, auth } from '../config/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Define the maximum stamps required for a reward
const STAMP_MAX = 10;
const REWARD_VALUE = 100; // $100 discount

export default function ClientDash() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all'); 
  const [editingId, setEditingId] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [viewProofJob, setViewProofJob] = useState(null);
  
  // --- LOYALTY STATE ---
  const [stamps, setStamps] = useState(0); 
  const [isRewardAvailable, setIsRewardAvailable] = useState(false);
  // ---------------------

  const [formData, setFormData] = useState({
    pickupName: '', pickupPhone: '', from: '',
    dropoffName: '', dropoffPhone: '', to: '',
    notes: '', amount: '', paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    hour: '10', minute: '00', ampm: 'AM',
    acceptSurcharge: false,
    purchaseOrder: '', poType: 'entry'    
  });

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

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
  const timeStatus = getTimeValidation();

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

    // 1. Apply Surcharge
    if (isLate) {
        surcharge = base * 0.5;
        subtotal += surcharge;
    }
    
    // 2. Apply Loyalty Discount (Applied to the final total amount)
    if (isRewardAvailable) {
        // Discount is the lesser of the REWARD_VALUE or the current subtotal
        discount = Math.min(subtotal, REWARD_VALUE);
        subtotal = subtotal - discount;
    }

    return { total: subtotal, surcharge: surcharge, isLate: isLate, discount: discount };
  };
  const { total, surcharge, isLate, discount } = calculateTotal();

  useEffect(() => {
    let unsubscribeSnapshot = () => {};
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // --- Fetch Loyalty Data from 'users' collection ---
        const userRef = doc(db, "users", user.uid);
        // Use onSnapshot for real-time loyalty updates
        const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
            const userData = userDoc.data() || {};
            const currentStamps = userData.stamps || 0;
            const rewardStatus = userData.isRewardAvailable || false;
            setStamps(currentStamps);
            setIsRewardAvailable(rewardStatus);
        });

        // --- Fetch Job Data from 'requests' collection ---
        const q = query(collection(db, "requests"), where("clientEmail", "==", user.email));
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setJobs(docs);
        });
        
        return () => { unsubscribeUser(); unsubscribeSnapshot(); };
      } else {
        setJobs([]);
        setStamps(0);
        setIsRewardAvailable(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handlePhoneInput = (val, field) => {
    const numericOnly = val.replace(/\D/g, '');
    if (numericOnly.length <= 9) setFormData(prev => ({ ...prev, [field]: numericOnly }));
  };

  const handleEdit = (job) => {
     setEditingId(job.id);
     const isNA = job.purchaseOrder === 'N/A';
     setFormData({
       ...job, 
       paymentMethod: job.paymentMethod || 'cash',
       // Recalculate acceptSurcharge based on current job total vs amount, as job may have a surcharge
       acceptSurcharge: job.totalAmount > job.amount, 
       poType: isNA ? 'na' : 'entry',
       purchaseOrder: isNA ? '' : job.purchaseOrder
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCounterClick = (job) => {
    if (!confirm("Are you sure you want to make a counter-offer? This is your one-time chance to modify the request after rejection.")) return;
    handleEdit(job);
  };

  const handleAcceptCounter = async (job) => {
      if (!confirm("Are you sure you want to accept the new terms?")) return;
      
      const updates = { 
          status: 'accepted',
          hasUnreadEdit: true, 
          hasClientCountered: true, 
          rejectionDetails: null 
      };

      // Apply counter price
      if (job.rejectionDetails?.counterPrice) {
          const counterPrice = parseFloat(job.rejectionDetails.counterPrice);
          updates.amount = counterPrice;
          updates.totalAmount = counterPrice; 
      }

      // Apply counter time
      if (job.rejectionDetails?.counterTime) {
          const t = job.rejectionDetails.counterTime;
          updates.date = t.date;
          updates.hour = t.hour;
          updates.minute = t.minute;
          updates.ampm = t.ampm;
      }
      
      updates.paymentMethod = job.paymentMethod || 'cash';
      updates.acceptSurcharge = false; 

      try {
          await updateDoc(doc(db, "requests", job.id), updates);
          alert("Offer Accepted! Job is now active.");
      } catch {
        alert("Error accepting offer.");
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.pickupPhone.length < 9) return alert("Pickup Phone must be 9 digits.");
    if (formData.dropoffPhone.length < 9) return alert("Dropoff Phone must be 9 digits.");
    if (!timeStatus.isValid) return alert(`Cannot submit: ${timeStatus.error}`);
    if (isLate && !formData.acceptSurcharge) return alert("For same-day delivery after 2 PM, you must accept the surcharge.");
    if (formData.poType === 'entry' && !formData.purchaseOrder.trim()) return alert("Please enter a Purchase Order number or select N/A.");
    // Check if the discount is available but not applied (meaning the client needs to re-enter the price)
    if (isRewardAvailable && discount === 0 && parseFloat(formData.amount) > 0) return alert("Reward is available! Enter the correct offer amount, the discount will be applied automatically.");

    setLoading(true);
    try {
      const finalPO = formData.poType === 'na' ? "N/A" : formData.purchaseOrder;
      const payload = {
        ...formData,
        purchaseOrder: finalPO,
        amount: parseFloat(formData.amount),
        surcharge: surcharge,
        totalAmount: total,
        clientEmail: auth.currentUser.email,
        clientId: auth.currentUser.uid,
        status: 'pending',
        updatedAt: serverTimestamp(),
        // --- PHASE 5 LOYALTY INTEGRATION ---
        rewardUsed: isRewardAvailable && discount > 0,
        // -----------------------------------
      };
      delete payload.poType; 

      if (!editingId) {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "requests"), payload);
        alert(`Request Sent! Total: $${total.toFixed(2)}.`);
        
        // --- PHASE 5: Handle Reward Reset locally and remotely ---
        if (payload.rewardUsed) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                stamps: 0,
                isRewardAvailable: false,
            });
            alert(`Reward claimed! $${discount.toFixed(2)} discount applied. Loyalty card reset.`);
        }
      } else {
        payload.hasUnreadEdit = true;
        
        const jobToEdit = jobs.find(j => j.id === editingId);
        // Set hasClientCountered when submitting an edit on a rejected job
        if (jobToEdit && jobToEdit.status === 'rejected' && !jobToEdit.hasClientCountered) {
            payload.hasClientCountered = true; 
            payload.rejectionDetails = null; 
        }

        await updateDoc(doc(db, "requests", editingId), payload);
        alert("Request Updated!");
        setEditingId(null);
      }
      setFormData({
        pickupName: '', pickupPhone: '', from: '',
        dropoffName: '', dropoffPhone: '', to: '',
        notes: '', amount: '', paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        hour: '10', minute: '00', ampm: 'AM',
        acceptSurcharge: false,
        purchaseOrder: '',
        poType: 'entry'
      });
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };
const getStatusBadge = (status) => {
    switch(status) {
      case 'accepted': return <span className="flex items-center bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><CheckCircle className="h-4 w-4 mr-1"/> Accepted</span>;
      case 'rejected': return <span className="flex items-center bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><XCircle className="h-4 w-4 mr-1"/> Rejected</span>;
      case 'delivered': return <span className="flex items-center bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><Package className="h-4 w-4 mr-1"/> Delivered</span>;
      default: return <span className="flex items-center bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase"><Clock className="h-4 w-4 mr-1"/> Pending</span>;
    }
  };
  
  // Loyalty Card Component - FINALIZED UI
  const LoyaltyCard = () => (
      <div className={`p-4 rounded-xl mb-5 shadow-lg border-2 ${isRewardAvailable || stamps >= STAMP_MAX ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-lg flex items-center text-gray-800"><Heart className="h-5 w-5 mr-2 text-red-500" /> My Loyalty Card</h4>
              {isRewardAvailable || stamps >= STAMP_MAX && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">REWARD READY!</span>}
          </div>
          
          <div className="flex flex-wrap gap-1 justify-center">
              {[...Array(STAMP_MAX)].map((_, i) => (
                  <div key={i} className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300`} style={{ flexBasis: 'calc(20% - 4px)'}}>
                      <Star className={`h-5 w-5 ${stamps > i ? (isRewardAvailable || stamps >= STAMP_MAX ? 'text-yellow-500 fill-yellow-500' : 'text-blue-500 fill-blue-500') : 'text-gray-400'}`} />
                  </div>
              ))}
          </div>
          
          <p className={`text-sm mt-3 font-semibold text-center ${isRewardAvailable || stamps >= STAMP_MAX ? 'text-green-700' : 'text-gray-500'}`}>
              {isRewardAvailable || stamps >= STAMP_MAX
                 ? `Your next delivery is FREE (up to $${REWARD_VALUE} value)!` 
                 : `Deliveries until reward: ${STAMP_MAX - stamps}`
              }
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
             <span className="font-medium italic">Terms: Full van (1-tonne, 6 cubic metres) max. Excludes tolls/surcharges.</span>
          </p>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      {/* RESPONSIVE PROOF MODAL */}
      {viewProofJob && (
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
      )}

      <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8 gap-8">
        {/* FORM SECTION */}
        <div className="md:col-span-1 order-1">
          <div className="bg-white shadow-lg rounded-xl p-5 sticky top-24 border border-gray-100">
            {/* LOYALTY CARD INTEGRATION */}
            <LoyaltyCard />
            {/* END LOYALTY CARD */}
            
            <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center"><FileText className="h-5 w-5 mr-2" />{editingId ? "Edit Request" : "New Delivery"}</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-r shadow-sm"><div className="flex items-start"><Clock className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" /><div className="text-xs text-red-800 font-medium leading-relaxed space-y-1"><p><span className="font-bold uppercase tracking-wide">Important:</span> We require at least <span className="underline decoration-red-400 font-bold">2 hours notice</span>.</p><p>Operating Hours: <span className="font-semibold">7am - 6pm</span>.</p><p className="font-bold text-red-700 pt-1">* 50% surcharge applies same-day after 2 PM.</p></div></div></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2"><p className="text-xs font-bold text-gray-500 uppercase">Pickup From</p><input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.pickupName} onChange={e => setFormData({...formData, pickupName: e.target.value})} /><div className="flex rounded shadow-sm"><span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">+61</span><input type="text" inputMode="numeric" required placeholder="4XX XXX XXX" className="flex-1 w-full px-3 py-2 rounded-r border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.pickupPhone} onChange={e => handlePhoneInput(e.target.value, 'pickupPhone')} /></div><input required placeholder="Address (From)" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} /></div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2"><p className="text-xs font-bold text-gray-500 uppercase">Dropoff To</p><input required placeholder="Contact Name" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.dropoffName} onChange={e => setFormData({...formData, dropoffName: e.target.value})} /><div className="flex rounded shadow-sm"><span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">+61</span><input type="text" inputMode="numeric" required placeholder="4XX XXX XXX" className="flex-1 w-full px-3 py-2 rounded-r border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.dropoffPhone} onChange={e => handlePhoneInput(e.target.value, 'dropoffPhone')} /></div><input required placeholder="Address (To)" className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} /></div>
              <div className="flex flex-col gap-2"><label className="text-xs font-bold text-gray-500 uppercase mt-1">Date & Time</label><input type="date" required className="w-full p-2 border rounded text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /><div className="flex gap-2"><select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.hour} onChange={e => setFormData({...formData, hour: e.target.value})}>{[...Array(12)].map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}</select><select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.minute} onChange={e => setFormData({...formData, minute: e.target.value})}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select><select className="flex-1 p-2 border rounded text-sm bg-white" value={formData.ampm} onChange={e => setFormData({...formData, ampm: e.target.value})}><option>AM</option><option>PM</option></select></div></div>
              <div className="flex gap-2 mt-2">{['cash', 'bank'].map((m) => (<div key={m} onClick={() => setFormData({...formData, paymentMethod: m})} className={`flex-1 p-2 rounded border cursor-pointer flex items-center justify-between text-sm ${formData.paymentMethod === m ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}><span className="capitalize">{m}</span>{formData.paymentMethod === m && <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle className="h-3 w-3 text-white" /></div>}</div>))}</div>
              {formData.paymentMethod === 'bank' && <div className="text-xs bg-blue-50 p-2 rounded text-blue-800 border border-blue-100"><p>BSB: 063-000 | ACC: 1234 5678</p></div>}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2"><p className="text-xs font-bold text-gray-500 uppercase">Purchase Order</p><div className="flex items-center gap-3"><input type="text" placeholder="Enter PO Number" className={`flex-1 p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${formData.poType === 'na' ? 'bg-gray-100 text-gray-400' : 'bg-white'}`} value={formData.purchaseOrder} onFocus={() => setFormData({...formData, poType: 'entry'})} onChange={e => setFormData({...formData, purchaseOrder: e.target.value, poType: 'entry'})} /><label className="flex items-center cursor-pointer select-none"><input type="radio" checked={formData.poType === 'na'} onChange={() => setFormData({...formData, poType: 'na', purchaseOrder: ''})} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" /><span className="ml-2 text-sm text-gray-700">N/A</span></label></div></div>
              {timeStatus.isValid ? (
                  <div>
                    <div className="relative rounded shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><DollarSign className="h-4 w-4 text-gray-400" /></div>
                        <input type="number" required className="pl-8 w-full border rounded py-2 text-sm" placeholder="Offer Amount ($)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                    {isLate && <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100"><p className="font-bold">Subtotal: ${total.toFixed(2)} (+50% Surcharge)</p><label className="flex items-center mt-1"><input type="checkbox" required checked={formData.acceptSurcharge} onChange={e => setFormData({...formData, acceptSurcharge: e.target.checked})} className="mr-2" /> I accept</label></div>}
                    
                    {/* TOTAL / DISCOUNT DISPLAY */}
                    {isRewardAvailable && discount > 0 && (
                        <div className="mt-3 bg-green-50 p-3 rounded border border-green-100">
                           <p className="text-green-800 font-bold text-sm">REWARD APPLIED: -${discount.toFixed(2)}</p>
                           <p className="text-lg font-bold text-green-700">FINAL TOTAL: ${total.toFixed(2)}</p>
                        </div>
                    )}
                    {!isRewardAvailable && <p className="text-sm text-gray-500 font-bold mt-2">Total Estimate: ${total.toFixed(2)}</p>}
                    
                  </div>
              ) : (
                  <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center animate-pulse"><AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" /><p className="text-red-800 font-bold text-sm">Cannot Complete Request</p><p className="text-red-600 text-xs mt-1">{timeStatus.error}</p><p className="text-red-600 text-xs mt-1">Please select a different time.</p></div>
              )}
              <div><label className="text-xs text-gray-500 font-bold mb-1 block">Notes <span className="font-normal lowercase">(what is being delivered?)</span></label><textarea required className="w-full border rounded p-2 text-sm" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
              <button type="submit" disabled={loading || !timeStatus.isValid} className={`w-full py-3 rounded text-white font-bold shadow-md text-sm transition-all ${!timeStatus.isValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{loading ? 'Processing...' : (editingId ? 'Update Request' : 'Submit Request')}</button>
            </form>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="md:col-span-2 order-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
             <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">My Requests ({jobs.length})</h3>
             <div className="flex bg-gray-100 p-1 rounded-lg space-x-1">{['all', 'pending', 'accepted', 'delivered', 'rejected'].map(status => (<button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{status}</button>))}</div>
          </div>
          
          {filteredJobs.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><p className="text-gray-500">No {filter !== 'all' ? filter : ''} requests found.</p></div>}

          {filteredJobs.map((job) => {
             // The variable canEdit is removed to clear linter warnings.
             
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
                      <p className="text-xs text-gray-500 flex items-center"><FileText className="h-3 w-3 mr-1"/> PO: <span className="font-medium ml-1">{job.purchaseOrder || 'N/A'}</span></p>
                      <div className="mt-2 bg-gray-50 px-2 py-1 rounded inline-block"><p className="text-xs text-gray-600">Item: <span className="italic">{job.notes}</span></p></div>
                      
                      {job.status === 'rejected' && job.rejectionDetails && (
                        <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-gray-700">
                            <p className="font-bold text-red-800 mb-1 flex items-center"><AlertTriangle className="h-4 w-4 mr-1"/> Request Rejected</p>
                            <p><span className="font-semibold">Reason:</span> {job.rejectionDetails.reason === 'price' ? 'Price too low' : job.rejectionDetails.reason === 'time' ? 'Time conflict' : 'Other'}</p>
                            {job.rejectionDetails.note && <p className="italic text-gray-600 mt-1">"{job.rejectionDetails.note}"</p>}
                            
                            {(job.rejectionDetails.counterPrice || job.rejectionDetails.counterTime) && (
                                <div className="mt-3 bg-white p-2 rounded border border-gray-200 flex justify-between items-center flex-wrap">
                                    {job.rejectionDetails.counterPrice && <span className="font-bold text-blue-600 mr-2 block w-full sm:w-auto">Owner Proposes: ${job.rejectionDetails.counterPrice}</span>}
                                    {job.rejectionDetails.counterTime && <span className="font-bold text-blue-600 text-xs mr-2 block w-full sm:w-auto">Owner Proposes: {job.rejectionDetails.counterTime.date} @ {job.rejectionDetails.counterTime.hour}:{job.rejectionDetails.counterTime.minute} {job.rejectionDetails.counterTime.ampm}</span>}
                                    
                                    {!job.hasClientCountered && (
                                      <div className="flex gap-2 mt-2 sm:mt-0">
                                         <button onClick={() => handleAcceptCounter(job)} className="bg-green-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-green-700">Accept Offer</button>
                                         <button onClick={() => handleCounterClick(job)} className="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-blue-700">Counter</button>
                                      </div>
                                    )}
                                    {job.hasClientCountered && <span className="text-xs font-bold text-green-700">Counter offer accepted or re-submitted.</span>}
                                </div>
                            )}

                        </div>
                      )}
                      
                      {job.rewardUsed && <div className="mt-3 bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded inline-block font-bold">LOYALTY REWARD CLAIMED</div>}
                   </div>
                   
                   <div className="text-right">
                      <p className="font-bold text-2xl text-blue-600">${job.totalAmount || job.amount}</p>
                      <p className="text-xs text-gray-400 capitalize mb-2">{job.paymentMethod}</p>
                      
                      {job.status === 'delivered' ? (
                        <button onClick={() => setViewProofJob(job)} className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1.5 rounded-full font-bold flex items-center transition-colors"><Package className="h-3 w-3 mr-1"/> View Proof</button>
                      ) : (
                         // Show Edit button only if pending, otherwise rely on Accept/Counter buttons in rejection box
                         job.status === 'pending' && (
                             <button 
                                onClick={() => handleEdit(job)} 
                                className={`text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold flex items-center transition-colors hover:bg-blue-100`}
                                title="Edit request"
                             >
                               <Edit2 className="h-3 w-3 mr-1"/> Edit
                            </button>
                        )
                      )}
                   </div>
                </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}