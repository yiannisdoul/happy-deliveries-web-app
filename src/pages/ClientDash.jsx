import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { REWARD_VALUE } from '../utils/constants';

// LOGIC IMPORTS
import { checkAndPerformReset } from '../utils/resetLogic';
import { calculateQuote } from '../utils/pricingAlgorithm'; 
import { getRouteDetails } from '../utils/mapService';      

// COMPONENTS
import LoyaltyCard from '../components/Client/LoyaltyCard';
import RequestForm from '../components/Client/RequestForm';
import ClientJobCard from '../components/Client/JobCard';
import ProofViewModal from '../components/Client/ProofViewModal';
import CounterOfferModal from '../components/Client/CounterOfferModal';
import GamificationBar from '../components/Client/GamificationBar';

// --- HELPER: Get Tomorrow's Date for Default State ---
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

    // --- PRICING ALGORITHM STATE ---
    const [quoteResult, setQuoteResult] = useState(null);

    const [formData, setFormData] = useState({
        pickupName: '', pickupPhone: '', from: '',
        dropoffName: '', dropoffPhone: '', to: '',
        notes: '', paymentMethod: 'cash',
        
        // New Fields for Algorithm (Fixes "undefined reading length" crash)
        weight: '', 
        dimensions: { length: '', width: '', height: '' },
        requiresHelp: false,
        specializedHandling: false,

        date: getTomorrowDate(),
        hour: '10', minute: '00', ampm: 'AM',
        acceptSurcharge: false,
        purchaseOrder: '', poType: 'entry'    
    });

    // DATA FETCHING
    useEffect(() => {
        let unsubscribeSnapshot = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
                    const userData = userDoc.data() || {};
                    checkAndPerformReset({ uid: user.uid, ...userData }); 
                    setStamps(userData.stamps || 0);
                    setRewardCount(userData.rewardCount || 0); 
                    setMonthlyCount(userData.monthly_delivery_count || 0);
                });
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

    const handlePhoneInput = (val, field) => {
        const numericOnly = val.replace(/\D/g, '');
        if (numericOnly.length <= 9) setFormData(prev => ({ ...prev, [field]: numericOnly }));
    };

    // --- NEW ALGORITHM HANDLER ---
    const handleCalculateQuote = async () => {
        setLoading(true);
        try {
            const route = await getRouteDetails(formData.from, formData.to);
            
            const l = parseFloat(formData.dimensions.length) || 0;
            const w = parseFloat(formData.dimensions.width) || 0;
            const h = parseFloat(formData.dimensions.height) || 0;
            const volumeM3 = (l * w * h) / 1000000; // cm3 to m3
            
            const result = calculateQuote(
                route.distanceKm, 
                volumeM3, 
                parseFloat(formData.weight), 
                { 
                    requiresHelp: formData.requiresHelp,
                    specializedHandling: formData.specializedHandling
                }
            );
            
            result.distance = route.distanceKm;
            setQuoteResult(result);
        } catch (error) {
            console.error(error);
            alert("Could not calculate quote. Please check address details.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (job) => {
        setEditingId(job.id);
        const isNA = job.purchaseOrder === 'N/A';
        setFormData({
            ...job, paymentMethod: job.paymentMethod || 'cash',
            // Safely handle potentially missing legacy fields
            weight: job.weight || '',
            dimensions: { 
                length: job.dimLength || '', 
                width: job.dimWidth || '', 
                height: job.dimHeight || '' 
            },
            requiresHelp: job.requiresHelp || false,
            specializedHandling: job.specializedHandling || false,
            
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
        if (counteringJob.rejectionDetails?.reason === 'price' && !counterPrice) return alert("Please enter a new price.");
        if (!confirm("Send this counter-offer? This is your final chance to modify the request.")) return;
        
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
            updatedDate = counterDate; updatedHour = counterHour; updatedMinute = counterMinute; updatedAmpm = counterAmpm;
        }
        
        try {
            await updateDoc(doc(db, "requests", job.id), {
                amount: updatedAmount, totalAmount: updatedTotalAmount,
                date: updatedDate, hour: updatedHour, minute: updatedMinute, ampm: updatedAmpm,
                notes: counterNote, status: 'pending', hasUnreadEdit: true,
                hasClientCountered: true, rejectionDetails: null, updatedAt: serverTimestamp()
            });
            alert("Counter Offer Sent!");
        } catch (e) { alert("Error: " + e.message); } 
        finally { setCounteringJob(null); }
    };

    const handleAcceptCounter = async (job) => {
        if (!confirm("Accept new terms?")) return;
        const updates = { status: 'accepted', hasUnreadEdit: true, hasClientCountered: true, rejectionDetails: null };
        if (job.rejectionDetails?.counterPrice) {
            const p = parseFloat(job.rejectionDetails.counterPrice); updates.amount = p; updates.totalAmount = p; 
        }
        if (job.rejectionDetails?.counterTime) {
            const t = job.rejectionDetails.counterTime;
            updates.date = t.date; updates.hour = t.hour; updates.minute = t.minute; updates.ampm = t.ampm;
        }
        try { await updateDoc(doc(db, "requests", job.id), updates); alert("Offer Accepted!"); } 
        catch { alert("Error accepting offer."); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.pickupPhone.length < 9) return alert("Pickup Phone must be 9 digits.");
        if (!quoteResult) return alert("Please calculate a quote first.");

        setLoading(true);
        try {
            const finalPO = formData.poType === 'na' ? "N/A" : formData.purchaseOrder;
            const baseAmount = quoteResult.status === 'QUOTE' ? quoteResult.price : 0;
            let finalAmount = baseAmount;
            let discountApplied = 0;

            if (quoteResult.status === 'QUOTE' && useRewardOnThisJob && rewardCount > 0) {
                discountApplied = Math.min(finalAmount, REWARD_VALUE);
                finalAmount = finalAmount - discountApplied;
            }

            const payload = {
                ...formData,
                // Flatten dimensions
                dimLength: formData.dimensions.length,
                dimWidth: formData.dimensions.width,
                dimHeight: formData.dimensions.height,
                // Algo results
                distanceKm: quoteResult.distance,
                vehicleType: quoteResult.vehicle || 'Pending',
                quoteStatus: quoteResult.status,
                // Financials
                amount: finalAmount,
                originalQuote: baseAmount,
                discountApplied: discountApplied,

                purchaseOrder: finalPO,
                clientEmail: auth.currentUser.email,
                clientId: auth.currentUser.uid,
                status: 'pending',
                updatedAt: serverTimestamp(),
                rewardUsed: discountApplied > 0,
            };
            delete payload.poType; 
            delete payload.dimensions;

            if (!editingId) {
                payload.createdAt = serverTimestamp();
                await addDoc(collection(db, "requests"), payload);
                if (payload.rewardUsed) {
                    await updateDoc(doc(db, "users", auth.currentUser.uid), { rewardCount: rewardCount - 1 });
                    setUseRewardOnThisJob(false); 
                }
                alert(quoteResult.status === 'NEGOTIATING' ? "Request Sent for Negotiation!" : `Request Sent! Total: $${finalAmount}`);
            } else {
                // For edits, we might keep basic update logic or force re-quote. Keeping simple update for now.
                payload.hasUnreadEdit = true;
                await updateDoc(doc(db, "requests", editingId), payload);
                alert("Request Updated!"); setEditingId(null);
            }
            
            setQuoteResult(null);
            setFormData({
                pickupName: '', pickupPhone: '', from: '', dropoffName: '', dropoffPhone: '', to: '',
                notes: '', paymentMethod: 'cash', weight: '', dimensions: { length: '', width: '', height: '' },
                requiresHelp: false, specializedHandling: false,
                date: getTomorrowDate(), hour: '10', minute: '00', ampm: 'AM', purchaseOrder: '', poType: 'entry'
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
                counteringJob={counteringJob} setCounteringJob={setCounteringJob}
                handleSubmitCounterModal={handleSubmitCounterModal}
                counterNote={counterNote} setCounterNote={setCounterNote}
                counterPrice={counterPrice} setCounterPrice={setCounterPrice}
                counterDate={counterDate} setCounterDate={setCounterDate}
                counterHour={counterHour} setCounterHour={counterHour}
                counterMinute={counterMinute} setCounterMinute={setCounterMinute}
                counterAmpm={counterAmpm} setCounterAmpm={setCounterAmpm}
            />

            <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8 gap-8">
                <div className="md:col-span-1 order-1">
                    <div className="space-y-4">
                        <GamificationBar monthlyDeliveryCount={monthlyCount} />
                        <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-100 relative"> 
                            <div id="loyalty-card-target"><LoyaltyCard stamps={stamps} rewardCount={rewardCount} useRewardOnThisJob={useRewardOnThisJob} setUseRewardOnThisJob={setUseRewardOnThisJob} monthlyDeliveryCount={monthlyCount} /></div>
                            <div id="request-form-target">
                                <RequestForm
                                    formData={formData} setFormData={setFormData}
                                    handleSubmit={handleSubmit} handlePhoneInput={handlePhoneInput}
                                    quoteResult={quoteResult} handleCalculateQuote={handleCalculateQuote}
                                    loading={loading} editingId={editingId}
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
                                key={job.id} job={job}
                                openCounterModal={openCounterModal} // Correct prop
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