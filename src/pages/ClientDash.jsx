import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { REWARD_VALUE } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

// UTILS
import { checkAndPerformReset } from '../utils/resetLogic';
import { calculatePrice, DISTANCE_OPTIONS, WEIGHT_OPTIONS } from '../utils/pricingCalculator';

// COMPONENTS
import LoyaltyCard from '../components/Client/LoyaltyCard';
import RequestForm from '../components/Client/RequestForm';
import ClientJobCard from '../components/Client/JobCard';
import ProofViewModal from '../components/Client/ProofViewModal';
import CounterOfferModal from '../components/Client/CounterOfferModal';
import GamificationBar from '../components/Client/GamificationBar';

const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

export default function ClientDash() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filter, setFilter] = useState('all'); 
    const [editingId, setEditingId] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [viewProofJob, setViewProofJob] = useState(null);
    
    // --- LOYALTY & GAMIFICATION STATE ---
    const [stamps, setStamps] = useState(0); 
    const [rewardCount, setRewardCount] = useState(0); 
    const [monthlyCount, setMonthlyCount] = useState(0); 
    const [useRewardOnThisJob, setUseRewardOnThisJob] = useState(false); 
    
    // --- COUNTER MODAL STATE ---
    const [counteringJob, setCounteringJob] = useState(null); 
    const [counterNote, setCounterNote] = useState('');
    const [counterPrice, setCounterPrice] = useState('');
    const [counterDate, setCounterDate] = useState('');
    const [counterHour, setCounterHour] = useState('10');
    const [counterMinute, setCounterMinute] = useState('00');
    const [counterAmpm, setCounterAmpm] = useState('AM');

    // --- FORM DATA ---
    // Defaults: Distance Index 2 (50-75km), Weight Index 0 (<1t) -> $160
    const [formData, setFormData] = useState({
        pickupName: '', pickupPhone: '', from: '',
        dropoffName: '', dropoffPhone: '', to: '',
        notes: '', paymentMethod: 'cash',
        date: getTomorrowDate(),
        hour: '10', minute: '00', ampm: 'AM',
        acceptSurcharge: false,
        purchaseOrder: '', poType: 'entry',
        distIndex: 2, 
        weightIndex: 0
    });

    useEffect(() => {
        let unsubscribeSnapshot = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // 1. User Profile
                const userRef = doc(db, "users", user.uid);
                const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
                    const userData = userDoc.data() || {};
                    checkAndPerformReset({ uid: user.uid, ...userData }); 
                    setStamps(userData.stamps || 0);
                    setRewardCount(userData.rewardCount || 0); 
                    setMonthlyCount(userData.monthly_delivery_count || 0);
                });

                // 2. Requests
                const q = query(collection(db, "requests"), where("clientEmail", "==", user.email));
                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    setJobs(docs);
                });
                return () => { unsubscribeUser(); unsubscribeSnapshot(); };
            } else {
                setJobs([]); setStamps(0); setRewardCount(0); setMonthlyCount(0); setUseRewardOnThisJob(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

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

    // --- TOTAL CALCULATION (With Rounding) ---
    const calculateTotal = () => {
        // 1. Get Base Price (Already Rounded to 5 in utils)
        const { price, isQuote } = calculatePrice(formData.distIndex, formData.weightIndex);
        
        if (isQuote) {
            return { total: 0, subtotal: 0, surcharge: 0, isLate: false, discount: 0, isQuote: true };
        }

        // 2. Check Surcharge
        const isToday = new Date(formData.date).toDateString() === new Date().toDateString();
        let hour24 = parseInt(formData.hour);
        if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;
        const isLate = isToday && hour24 >= 14; 
        
        let subtotal = price;
        let surcharge = 0;
        let discount = 0;

        if (isLate) { 
            // ROUND SURCHARGE TO NEAREST 5
            // Ensures Base (rounded) + Surcharge (rounded) = Total (rounded)
            const rawSurcharge = price * 0.5;
            surcharge = Math.round(rawSurcharge / 5) * 5; 
            subtotal += surcharge; 
        }
        
        // 3. Apply Discount
        if (useRewardOnThisJob && rewardCount > 0) {
            discount = Math.min(subtotal, REWARD_VALUE);
            subtotal = Math.max(0, subtotal - discount);
        }

        return { total: subtotal, subtotal: subtotal, surcharge, isLate, discount, isQuote: false };
    };
    
    const { total, subtotal, surcharge, isLate, discount, isQuote } = calculateTotal();
    const timeStatus = getTimeValidation();

    const handlePhoneInput = (val, field) => {
        const numericOnly = val.replace(/\D/g, '');
        if (numericOnly.length <= 9) setFormData(prev => ({ ...prev, [field]: numericOnly }));
    };

    const handleEdit = (job) => {
        setEditingId(job.id);
        const isNA = job.purchaseOrder === 'N/A';
        
        // Convert stored labels back to indices
        const dIndex = DISTANCE_OPTIONS.findIndex(o => o.label === job.distanceLabel);
        const wIndex = WEIGHT_OPTIONS.findIndex(o => o.label === job.weightLabel);

        setFormData({
            ...job, paymentMethod: job.paymentMethod || 'cash',
            acceptSurcharge: job.totalAmount > job.amount, 
            poType: isNA ? 'na' : 'entry',
            purchaseOrder: isNA ? '' : job.purchaseOrder,
            distIndex: dIndex !== -1 ? dIndex : 2, 
            weightIndex: wIndex !== -1 ? wIndex : 0
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const openCounterModal = (job) => { setCounteringJob(job); setCounterNote(job.rejectionDetails?.note || ''); setCounterPrice(job.rejectionDetails?.counterPrice || job.amount); };
    const handleSubmitCounterModal = async (e) => { 
        e.preventDefault(); 
        if(!confirm("Send counter offer?")) return; 
        try { await updateDoc(doc(db, "requests", counteringJob.id), { 
            status: 'pending', hasUnreadEdit: true, hasClientCountered: true, rejectionDetails: null, 
            amount: parseFloat(counterPrice), totalAmount: parseFloat(counterPrice), notes: counterNote, updatedAt: serverTimestamp() 
        }); alert("Sent!"); setCounteringJob(null); } catch(e) { alert(e.message); } 
    };
    const handleAcceptCounter = async (job) => { 
        if (!confirm("Accept new terms?")) return;
        const updates = { status: 'accepted', hasUnreadEdit: true, hasClientCountered: true, rejectionDetails: null };
        if (job.rejectionDetails?.counterPrice) { updates.amount = parseFloat(job.rejectionDetails.counterPrice); updates.totalAmount = parseFloat(job.rejectionDetails.counterPrice); }
        if (job.rejectionDetails?.counterTime) { const t = job.rejectionDetails.counterTime; updates.date = t.date; updates.hour = t.hour; updates.minute = t.minute; updates.ampm = t.ampm; }
        try { await updateDoc(doc(db, "requests", job.id), updates); alert("Accepted!"); } catch { alert("Error."); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isQuote) return alert("Please call us for a special quote on this delivery.");
        if (formData.pickupPhone.length < 9 || formData.dropoffPhone.length < 9) return alert("Phone numbers must be 9 digits.");
        if (!timeStatus.isValid) return alert(`Cannot submit: ${timeStatus.error}`);
        if (isLate && !formData.acceptSurcharge) return alert("You must accept the surcharge for late same-day delivery.");
        if (formData.poType === 'entry' && !formData.purchaseOrder.trim()) return alert("Enter PO or select N/A.");

        setLoading(true);
        try {
            const finalPO = formData.poType === 'na' ? "N/A" : formData.purchaseOrder;
            
            const distLabel = DISTANCE_OPTIONS[formData.distIndex].label;
            const weightLabel = WEIGHT_OPTIONS[formData.weightIndex].label;

            const payload = {
                ...formData, 
                purchaseOrder: finalPO, 
                
                // Reconstruct Base Price from the Final Total
                // Total = (Base + Surcharge - Discount)
                // Base = Total + Discount - Surcharge
                amount: subtotal + discount - surcharge, 
                surcharge: surcharge, 
                totalAmount: total, 
                
                distanceLabel: distLabel,
                weightLabel: weightLabel,

                clientEmail: auth.currentUser.email,
                clientId: auth.currentUser.uid, 
                status: 'pending', 
                updatedAt: serverTimestamp(),
                rewardUsed: useRewardOnThisJob && discount > 0,
            };
            delete payload.poType; 
            delete payload.distIndex;
            delete payload.weightIndex;

            if (!editingId) {
                payload.createdAt = serverTimestamp();
                await addDoc(collection(db, "requests"), payload);
                alert(`Request Sent! Total: $${total.toFixed(2)}.`);
                
                if (payload.rewardUsed) {
                    await updateDoc(doc(db, "users", auth.currentUser.uid), { rewardCount: rewardCount - 1 });
                    setUseRewardOnThisJob(false); 
                }
            } else {
                payload.hasUnreadEdit = true;
                await updateDoc(doc(db, "requests", editingId), payload);
                alert("Request Updated!"); setEditingId(null);
            }
            
            setFormData({ pickupName: '', pickupPhone: '', from: '', dropoffName: '', dropoffPhone: '', to: '',
                notes: '', paymentMethod: 'cash', 
                date: getTomorrowDate(),
                hour: '10', minute: '00', ampm: 'AM', acceptSurcharge: false, purchaseOrder: '', poType: 'entry',
                distIndex: 2, weightIndex: 0
            });
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <ProofViewModal viewProofJob={viewProofJob} setViewProofJob={setViewProofJob} />
            <CounterOfferModal
                counteringJob={counteringJob} setCounteringJob={setCounteringJob} handleSubmitCounterModal={handleSubmitCounterModal}
                counterNote={counterNote} setCounterNote={setCounterNote} counterPrice={counterPrice} setCounterPrice={setCounterPrice}
                counterDate={counterDate} setCounterDate={setCounterDate} counterHour={counterHour} setCounterHour={setCounterHour}
                counterMinute={counterMinute} setCounterMinute={setCounterMinute} counterAmpm={counterAmpm} setCounterAmpm={setCounterAmpm}
            />

            <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8 gap-8">
                <div className="md:col-span-1 order-1">
                    <div className="space-y-4">
                        <div id="gamification-bar-target" className="relative">
                            <GamificationBar monthlyDeliveryCount={monthlyCount} />
                            {/* Info Icon for Tiers */}
                            <div 
                                className="absolute top-2 right-2 z-10 group cursor-pointer"
                                onClick={() => navigate('/tier-program')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle text-gray-900 hover:text-blue-700 transition-colors">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path>
                                    <path d="M12 17h.01"></path>
                                </svg>
                                <div className="absolute right-0 top-6 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-20">
                                    View details on tiers, floors, and rollover protection.
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-100 relative"> 
                            <div id="loyalty-card-target" className="relative">
                                <LoyaltyCard 
                                    stamps={stamps} rewardCount={rewardCount} useRewardOnThisJob={useRewardOnThisJob}
                                    setUseRewardOnThisJob={setUseRewardOnThisJob} monthlyDeliveryCount={monthlyCount} 
                                />
                                {/* Info Icon for Loyalty */}
                                <div 
                                    className="absolute top-2 right-2 z-10 group cursor-pointer"
                                    onClick={() => navigate('/loyalty-program')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle text-gray-900 hover:text-yellow-700 transition-colors">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path>
                                        <path d="M12 17h.01"></path>
                                    </svg>
                                    <div className="absolute right-0 top-6 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-20">
                                        Details on stamp earning, rewards, and how tiers affect your goal.
                                    </div>
                                </div>
                            </div>
                            
                            <div id="request-form-target">
                                <RequestForm
                                    formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handlePhoneInput={handlePhoneInput}
                                    timeStatus={timeStatus} isLate={isLate} total={total} subtotal={subtotal} discount={discount}
                                    editingId={editingId} loading={loading}
                                    isQuote={isQuote}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 order-2 space-y-4" id="jobs-list-target">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">My Requests ({jobs.length})</h3>
                        <div className="flex flex-wrap justify-center sm:justify-end bg-gray-100 p-1 rounded-lg space-x-1" id="jobs-filter-target">
                            {['all', 'pending', 'accepted', 'delivered', 'rejected'].map(status => (
                                <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{status}</button>
                            ))}
                        </div>
                    </div>
                    
                    {filteredJobs.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><p className="text-gray-500">No {filter !== 'all' ? filter : ''} requests found.</p></div>}

                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <ClientJobCard
                                key={job.id} job={job} openCounterModal={openCounterModal} 
                                handleAcceptCounter={handleAcceptCounter} setViewProofJob={setViewProofJob}
                                handleEdit={handleEdit} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}