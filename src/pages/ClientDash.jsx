import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { REWARD_VALUE, COMPANY_EMAIL, CLOUD_NAME, UPLOAD_PRESET } from '../utils/constants'; 
import { useNavigate } from 'react-router-dom';
import { checkAndPerformReset } from '../utils/resetLogic';
import { getJobProfile, getMinutesFromMidnight, checkSlotStatus } from '../utils/timeBlocking'; 
import { sendNotificationEmail, TEMPLATES } from '../utils/emailService';
import LoyaltyCard from '../components/Client/LoyaltyCard';
import RequestForm from '../components/Client/RequestForm';
import ClientJobCard from '../components/Client/JobCard';
import ProofViewModal from '../components/Client/ProofViewModal';
import CounterOfferModal from '../components/Client/CounterOfferModal';
import GamificationBar from '../components/Client/GamificationBar';

const getTomorrowDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0];
};

export default function ClientDash() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filter, setFilter] = useState('all'); 
    const [currentPage, setCurrentPage] = useState(1); // NEW: Pagination state
    const [editingId, setEditingId] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [viewProofJob, setViewProofJob] = useState(null);
    const [busyIntervals, setBusyIntervals] = useState([]); 
    const [stamps, setStamps] = useState(0); 
    const [rewardCount, setRewardCount] = useState(0); 
    const [monthlyCount, setMonthlyCount] = useState(0); 
    const [useRewardOnThisJob, setUseRewardOnThisJob] = useState(false); 
    
    const [receiptFile, setReceiptFile] = useState(null);
    
    const [counteringJob, setCounteringJob] = useState(null); 
    const [counterNote, setCounterNote] = useState('');
    const [counterPrice, setCounterPrice] = useState('');
    const [counterDate, setCounterDate] = useState('');
    const [counterHour, setCounterHour] = useState('10');
    const [counterMinute, setCounterMinute] = useState('00');
    const [counterAmpm, setCounterAmpm] = useState('AM');

    const [formData, setFormData] = useState({
        pickupName: '', pickupPhone: '', from: '',
        dropoffName: '', dropoffPhone: '', to: '',
        notes: '', paymentMethod: 'cash',
        date: getTomorrowDate(), hour: '10', minute: '00', ampm: 'AM',
        acceptSurcharge: false, purchaseOrder: '', poType: 'entry',
        weightBracket: 1, actualWeightLabel: '< 1.25', actualDistance: 50, 
        flights: 0, difficultAccess: false,
        calculatedBasePrice: 0, requiredTrips: 1,
        isQuoteRequired: false, accessCost: 0,
        receiptUrl: null,
        policyAgreed: false
    });

    const currentJobProfile = getJobProfile(
        formData.weightBracket, 
        formData.actualDistance, 
        formData.flights, 
        formData.difficultAccess
    );

    useEffect(() => {
        let unsubscribeSnapshot = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
                    const userData = userDoc.data() || {};
                    checkAndPerformReset({ uid: user.uid, ...userData }); 
                    setStamps(userData.stamps || 0); setRewardCount(userData.rewardCount || 0); setMonthlyCount(userData.monthly_delivery_count || 0);
                });
                const q = query(collection(db, "requests"), where("clientEmail", "==", user.email));
                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setJobs(docs);
                });
                return () => { unsubscribeUser(); unsubscribeSnapshot(); };
            } else { setJobs([]); setStamps(0); setRewardCount(0); setMonthlyCount(0); setUseRewardOnThisJob(false); }
        }); return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!formData.date) return;
        const q = query(collection(db, "requests"), where("date", "==", formData.date));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const intervals = [];
            snapshot.docs.forEach(doc => {
                const job = doc.data();
                if (job.status === 'rejected' || job.status === 'cancelled' || doc.id === editingId) return;
                
                const arrivalMins = getMinutesFromMidnight(job.hour, job.minute, job.ampm);
                
                let bracketToUse = job.weightBracket;
                if (!bracketToUse && job.actualWeight) {
                    if (job.actualWeight <= 1.25) bracketToUse = 1;
                    else if (job.actualWeight <= 2.5) bracketToUse = 2;
                    else if (job.actualWeight <= 3.75) bracketToUse = 3;
                    else bracketToUse = 4;
                }

                const profile = getJobProfile(
                    bracketToUse || 1, 
                    job.actualDistance || 50, 
                    job.flights || 0, 
                    job.difficultAccess || false
                );
                
                if (profile) {
                    intervals.push({ 
                        start: arrivalMins - profile.preArrivalMins, 
                        end: arrivalMins + profile.postArrivalMins 
                    });
                }
            }); 
            setBusyIntervals(intervals);
        }, (error) => { console.error("Error fetching time slots:", error); });
        return () => unsubscribe();
    }, [formData.date, editingId]); 

    useEffect(() => {
        let hour24 = parseInt(formData.hour);
        if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;
        const currentArrivalMins = (hour24 * 60) + parseInt(formData.minute);

        if (checkSlotStatus(currentArrivalMins, currentJobProfile, busyIntervals).isBlocked) {
            for (let h = 7; h <= 18; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 18 && m > 0) continue;
                    const checkArrivalMins = (h * 60) + m;
                    
                    if (!checkSlotStatus(checkArrivalMins, currentJobProfile, busyIntervals).isBlocked) {
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                        const displayMinute = m === 0 ? '00' : '30';
                        
                        setFormData(prev => ({
                            ...prev, 
                            hour: displayHour.toString(), 
                            minute: displayMinute, 
                            ampm
                        }));
                        return; 
                    }
                }
            }
        }
    }, [busyIntervals, currentJobProfile, formData.date, formData.hour, formData.minute, formData.ampm]); 

    // NEW: Pagination Logic
    const filteredJobs = jobs.filter(job => { if (filter === 'all') return true; return job.status === filter; });
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getTimeValidation = () => {
        let hour24 = parseInt(formData.hour);
        if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;
        const [year, month, day] = formData.date.split('-').map(Number);
        const bookingTime = new Date(year, month - 1, day, hour24, parseInt(formData.minute));
        const diffMs = bookingTime - new Date();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffMs < 0) return { isValid: false, error: "Time cannot be in the past." };
        if (diffHours < 2) return { isValid: false, error: "Too Soon: We require at least 2 hours notice." };
        
        const currentArrivalMins = (hour24 * 60) + parseInt(formData.minute);
        const status = checkSlotStatus(currentArrivalMins, currentJobProfile, busyIntervals);
        
        if (status.isBlocked) {
            if (status.reason === 'overlap') return { isValid: false, error: "This slot conflicts with an existing booking's travel or labor time." };
        }

        return { isValid: true, error: null };
    };

    const isQuote = formData.isQuoteRequired || false;
    const timeStatus = getTimeValidation();
    
    const isToday = new Date(formData.date).toDateString() === new Date().toDateString();
    let calculatedHour24 = parseInt(formData.hour);
    if (formData.ampm === 'PM' && calculatedHour24 !== 12) calculatedHour24 += 12;
    if (formData.ampm === 'AM' && calculatedHour24 === 12) calculatedHour24 = 0;
    
    const isLate = isToday && calculatedHour24 >= 14; 
    let baseSubtotal = formData.calculatedBasePrice || 0;
    let surchargeCost = 0; let discountApplied = 0;

    if (isLate) { surchargeCost = Math.round((baseSubtotal * 0.5) / 5) * 5; baseSubtotal += surchargeCost; }
    if (useRewardOnThisJob && rewardCount > 0) { discountApplied = Math.min(baseSubtotal, REWARD_VALUE); baseSubtotal = Math.max(0, baseSubtotal - discountApplied); }

    const total = baseSubtotal; const subtotal = formData.calculatedBasePrice || 0; const surcharge = surchargeCost; const discount = discountApplied;

    const handlePhoneInput = (val, field) => { const numericOnly = val.replace(/\D/g, ''); if (numericOnly.length <= 9) setFormData(prev => ({ ...prev, [field]: numericOnly })); };

    const handleEdit = (job) => {
        setEditingId(job.id);
        setReceiptFile(null); 
        setFormData({
            ...job, paymentMethod: job.paymentMethod || 'cash', acceptSurcharge: job.totalAmount > job.amount, 
            poType: job.purchaseOrder === 'N/A' ? 'na' : 'entry', purchaseOrder: job.purchaseOrder === 'N/A' ? '' : job.purchaseOrder,
            weightBracket: job.weightBracket || 1, actualWeightLabel: job.weightLabel || '< 1.25', actualDistance: job.actualDistance || 50, 
            flights: job.flights || 0, difficultAccess: job.difficultAccess || false,
            calculatedBasePrice: job.amount || 0, accessCost: job.accessCost || 0,
            notes: job.notes || '',
            receiptUrl: job.receiptUrl || null,
            policyAgreed: true 
        }); 
        
        setTimeout(() => {
            const formElement = document.getElementById('request-form-target');
            if (formElement) {
                const yOffset = -80; 
                const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setReceiptFile(null);
        setFormData({ 
            pickupName: '', pickupPhone: '', from: '', dropoffName: '', dropoffPhone: '', to: '', notes: '', paymentMethod: 'cash', 
            date: getTomorrowDate(), hour: '10', minute: '00', ampm: 'AM', acceptSurcharge: false, purchaseOrder: '', poType: 'entry',
            weightBracket: 1, actualWeightLabel: '< 1.25', actualDistance: 50, flights: 0, difficultAccess: false, calculatedBasePrice: 0, requiredTrips: 1, isQuoteRequired: false, accessCost: 0,
            receiptUrl: null, policyAgreed: false
        });
    };

    const handleUpdateReceipt = async (job, file) => {
        if (!file) return;
        
        const warningMsg = "WARNING: If this new document is incorrect and results in the wrong items being picked up/delivered, you will be liable for a 2nd full delivery fee PLUS a 25% return-to-warehouse surcharge.\n\nDo you accept this and wish to update the document?";
        
        if (!window.confirm(warningMsg)) return;
        
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('upload_preset', UPLOAD_PRESET);
            
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: uploadData
            });
            
            if (!res.ok) throw new Error("Failed to upload the new document.");
            
            const data = await res.json();
            const newReceiptUrl = data.secure_url;
            
            const previousReceipts = job.previousReceipts || [];
            if (job.receiptUrl) {
                previousReceipts.push({
                    url: job.receiptUrl,
                    replacedAt: new Date().toISOString()
                });
            }
            
            await updateDoc(doc(db, "requests", job.id), {
                receiptUrl: newReceiptUrl,
                previousReceipts: previousReceipts,
                updatedAt: serverTimestamp(),
                hasUnreadEdit: true,
                documentUpdated: true 
            });
            
            alert("Document successfully updated!");
        } catch (error) {
            console.error(error);
            alert("Error updating document.");
        }
    };

    const handleCancelJob = async (job) => {
        let hour24 = parseInt(job.hour);
        if (job.ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (job.ampm === 'AM' && hour24 === 12) hour24 = 0;
        const [year, month, day] = job.date.split('-').map(Number);
        
        const arrivalTime = new Date(year, month - 1, day, hour24, parseInt(job.minute));
        const now = new Date();

        let bracketToUse = job.weightBracket;
        if (!bracketToUse && job.actualWeight) {
            if (job.actualWeight <= 1.25) bracketToUse = 1;
            else if (job.actualWeight <= 2.5) bracketToUse = 2;
            else if (job.actualWeight <= 3.75) bracketToUse = 3;
            else bracketToUse = 4;
        }

        const profile = getJobProfile(
            bracketToUse || 1, 
            job.actualDistance || 50, 
            job.flights || 0, 
            job.difficultAccess || false
        );

        let isLateCancel = false;
        let feeAmount = 0;

        if (profile) {
            const prepStartTime = new Date(arrivalTime.getTime() - (profile.preArrivalMins * 60000));
            if (now >= prepStartTime) {
                isLateCancel = true;
                feeAmount = (job.totalAmount || job.amount) * 0.25;
            }
        }

        let confirmMsg = "Are you sure you want to cancel this request?";
        if (isLateCancel) {
            confirmMsg = `WARNING: Because you are cancelling after the driver's dispatch/prep time has begun, a 25% late cancellation fee ($${feeAmount.toFixed(2)}) will apply. Do you wish to proceed?`;
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            const updates = { 
                status: 'cancelled', 
                cancelledAt: serverTimestamp(),
                isLateCancel,
                cancellationFee: isLateCancel ? feeAmount : 0
            };
            
            await updateDoc(doc(db, "requests", job.id), updates);
            
            if (job.rewardUsed) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userRef, { rewardCount: rewardCount + 1 });
            }

            sendNotificationEmail(TEMPLATES.OWNER_REQUEST_ALERT, { 
                to_name: "Owner", 
                to_email: COMPANY_EMAIL, 
                subject: "Request Cancelled by Client", 
                message: `Client ${auth.currentUser.email} has cancelled their job from ${job.from} to ${job.to}. ${isLateCancel ? 'A 25% late fee applies.' : 'No fee applies.'}`, 
                status: "Cancelled", 
                total_price: isLateCancel ? `$${feeAmount.toFixed(2)} (Fee)` : `$0.00`, 
                client_email: auth.currentUser.email, 
                job_time: `${job.date} @ ${job.hour}:${job.minute} ${job.ampm}`, 
                link: "https://dashboard.happydeliveries.com.au/owner" 
            });
            
            alert(isLateCancel ? `Job Cancelled. A 25% fee ($${feeAmount.toFixed(2)}) has been applied.` : "Job successfully cancelled.");
        } catch (error) {
            console.error(error);
            alert("Failed to cancel job.");
        }
    };
    
    const openCounterModal = (job) => { 
        setCounteringJob(job); setCounterNote(job.rejectionDetails?.note || ''); setCounterPrice(job.rejectionDetails?.counterPrice || job.amount); 
        if (job.rejectionDetails?.counterTime) { setCounterDate(job.rejectionDetails.counterTime.date); setCounterHour(job.rejectionDetails.counterTime.hour); setCounterMinute(job.rejectionDetails.counterTime.minute); setCounterAmpm(job.rejectionDetails.counterTime.ampm); }
    };

    const handleSubmitCounterModal = async (e) => { 
        e.preventDefault(); if(!confirm("Are you sure you want to send this counter-offer?")) return; 
        try { 
            const updates = { status: 'pending', hasUnreadEdit: true, hasClientCountered: true, rejectionDetails: null, updatedAt: serverTimestamp(), notes: counterNote };
            if (counteringJob.rejectionDetails?.reason === 'price') { updates.amount = parseFloat(counterPrice); updates.totalAmount = parseFloat(counterPrice); } 
            else if (counteringJob.rejectionDetails?.reason === 'time') { updates.date = counterDate; updates.hour = counterHour; updates.minute = counterMinute; updates.ampm = counterAmpm; }
            await updateDoc(doc(db, "requests", counteringJob.id), updates); 
            sendNotificationEmail(TEMPLATES.OWNER_REQUEST_ALERT, { to_name: "Owner", to_email: COMPANY_EMAIL, subject: "Counter Offer Received", message: `Client ${auth.currentUser.email} has sent a counter-offer.`, status: "Pending Review", total_price: `$${total.toFixed(2)}`, client_email: auth.currentUser.email, job_time: `${formData.date} @ ${formData.hour}:${formData.minute} ${formData.ampm}`, link: "https://dashboard.happydeliveries.com.au/owner" });
            alert("Counter Offer Sent!"); setCounteringJob(null); 
        } catch(e) { alert("Error sending counter: " + e.message); } 
    };

    const handleAcceptCounter = async (job) => { 
        if (!confirm("Are you sure you want to accept?")) return;
        const updates = { status: 'accepted', hasUnreadEdit: true, hasClientCountered: true, rejectionDetails: null };
        if (job.rejectionDetails?.counterPrice) { updates.amount = parseFloat(job.rejectionDetails.counterPrice); updates.totalAmount = parseFloat(job.rejectionDetails.counterPrice); }
        if (job.rejectionDetails?.counterTime) { const t = job.rejectionDetails.counterTime; updates.date = t.date; updates.hour = t.hour; updates.minute = t.minute; updates.ampm = t.ampm; }
        try { 
            await updateDoc(doc(db, "requests", job.id), updates); 
            sendNotificationEmail(TEMPLATES.OWNER_REQUEST_ALERT, { to_name: "Owner", to_email: COMPANY_EMAIL, subject: "Offer Accepted by Client", message: `Client ${auth.currentUser.email} accepted your counter-offer.`, status: "Accepted", total_price: `$${total.toFixed(2)}`, client_email: auth.currentUser.email, job_time: `${job.date} @ ${job.hour}:${job.minute} ${job.ampm}`, link: "https://dashboard.happydeliveries.com.au/owner" });
            alert("Offer Accepted!"); 
        } catch { alert("Error."); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isQuote) return alert("Please call us for a special quote.");
        if (formData.pickupPhone.length < 9 || formData.dropoffPhone.length < 9) return alert("Phone numbers must be 9 digits.");
        if (!timeStatus.isValid) return alert(`Cannot submit: ${timeStatus.error}`);
        if (isLate && !formData.acceptSurcharge) return alert("You must accept the surcharge.");
        if (formData.poType === 'entry' && !formData.purchaseOrder.trim()) return alert("Enter PO or select N/A.");
        
        if (!editingId && !receiptFile && !formData.receiptUrl) {
            return alert("Please attach a receipt or purchase order document before submitting.");
        }

        setLoading(true);
        try {
            let finalReceiptUrl = formData.receiptUrl || null;
            let documentUpdatedInFullEdit = false;
            let previousReceiptsToSave = [];
            
            const existingJob = editingId ? jobs.find(j => j.id === editingId) : null;

            if (receiptFile) {
                const uploadData = new FormData();
                uploadData.append('file', receiptFile);
                uploadData.append('upload_preset', UPLOAD_PRESET);
                
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                    method: 'POST',
                    body: uploadData
                });
                
                if (!res.ok) throw new Error("Failed to upload the receipt document.");
                
                const data = await res.json();
                finalReceiptUrl = data.secure_url;

                if (editingId && existingJob && existingJob.receiptUrl) {
                    previousReceiptsToSave = existingJob.previousReceipts ? [...existingJob.previousReceipts] : [];
                    previousReceiptsToSave.push({
                        url: existingJob.receiptUrl,
                        replacedAt: new Date().toISOString()
                    });
                    documentUpdatedInFullEdit = true;
                }
            }

            const finalPO = formData.poType === 'na' ? "N/A" : formData.purchaseOrder;
            const distLabel = `${formData.actualDistance} km`; 
            const weightLabel = `${formData.actualWeightLabel} Tonnes`;

            const payload = {
                ...formData, purchaseOrder: finalPO, 
                amount: subtotal + discount - surcharge, surcharge: surcharge, totalAmount: total, 
                distanceLabel: distLabel, weightLabel: weightLabel,
                clientEmail: auth.currentUser.email, clientId: auth.currentUser.uid, 
                updatedAt: serverTimestamp(), rewardUsed: useRewardOnThisJob && discount > 0,
                receiptUrl: finalReceiptUrl 
            };
            
            delete payload.poType;
            delete payload.actualWeightLabel;
            delete payload.policyAgreed; 

            if (!editingId) {
                payload.status = 'pending';
                payload.createdAt = serverTimestamp();
                await addDoc(collection(db, "requests"), payload);
                sendNotificationEmail(TEMPLATES.OWNER_REQUEST_ALERT, { to_name: "Owner", to_email: COMPANY_EMAIL, subject: "New Delivery Request", message: `New Job from ${formData.pickupName} to ${formData.dropoffName} (${distLabel}, ${weightLabel}) submitted.`, status: "Pending", total_price: `$${total.toFixed(2)}`, client_email: auth.currentUser.email, job_time: `${formData.date} @ ${formData.hour}:${formData.minute} ${formData.ampm}`, link: "https://dashboard.happydeliveries.com.au/owner" });
                alert(`Request Sent! Total: $${total.toFixed(2)}.`);
                if (payload.rewardUsed) { await updateDoc(doc(db, "users", auth.currentUser.uid), { rewardCount: rewardCount - 1 }); setUseRewardOnThisJob(false); }
            } else {
                payload.status = existingJob.status;
                payload.hasUnreadEdit = true;

                if (documentUpdatedInFullEdit) {
                    payload.previousReceipts = previousReceiptsToSave;
                    payload.documentUpdated = true;
                }

                await updateDoc(doc(db, "requests", editingId), payload);
                sendNotificationEmail(TEMPLATES.OWNER_REQUEST_ALERT, { to_name: "Owner", to_email: COMPANY_EMAIL, subject: "Request Updated by Client", message: `Client ${auth.currentUser.email} updated a request.`, status: "Pending", total_price: `$${total.toFixed(2)}`, client_email: auth.currentUser.email, job_time: `${formData.date} @ ${formData.hour}:${formData.minute} ${formData.ampm}`, link: "https://dashboard.happydeliveries.com.au/owner" });
                alert("Request Updated!"); setEditingId(null);
            }
            
            setReceiptFile(null); 
            setFormData({ 
                pickupName: '', pickupPhone: '', from: '', dropoffName: '', dropoffPhone: '', to: '', notes: '', paymentMethod: 'cash', 
                date: getTomorrowDate(), hour: '10', minute: '00', ampm: 'AM', acceptSurcharge: false, purchaseOrder: '', poType: 'entry',
                weightBracket: 1, actualWeightLabel: '< 1.25', actualDistance: 50, flights: 0, difficultAccess: false, calculatedBasePrice: 0, requiredTrips: 1, isQuoteRequired: false, accessCost: 0,
                receiptUrl: null, policyAgreed: false
            });
        } catch (e) { console.error(e); alert("Error submitting: " + e.message); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <ProofViewModal viewProofJob={viewProofJob} setViewProofJob={setViewProofJob} />
            <CounterOfferModal counteringJob={counteringJob} setCounteringJob={setCounteringJob} handleSubmitCounterModal={handleSubmitCounterModal} counterNote={counterNote} setCounterNote={setCounterNote} counterPrice={counterPrice} setCounterPrice={setCounterPrice} counterDate={counterDate} setCounterDate={setCounterDate} counterHour={counterHour} setCounterHour={counterHour} counterMinute={counterMinute} setCounterMinute={setCounterMinute} counterAmpm={counterAmpm} setCounterAmpm={setCounterAmpm} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div id="gamification-bar-target" className="relative bg-white shadow-sm rounded-xl p-5 border border-gray-100">
                    <GamificationBar monthlyDeliveryCount={monthlyCount} />
                    <div className="absolute top-2 right-2 z-10 group cursor-pointer" onClick={() => navigate('/tier-program')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle text-gray-900 hover:text-blue-700 transition-colors"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                        <div className="absolute right-0 top-6 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-20">View details on tiers, floors, and rollover protection.</div>
                    </div>
                </div>

                <div id="loyalty-card-target" className="relative bg-white shadow-sm rounded-xl p-5 border border-gray-100">
                    <LoyaltyCard stamps={stamps} rewardCount={rewardCount} useRewardOnThisJob={useRewardOnThisJob} setUseRewardOnThisJob={setUseRewardOnThisJob} monthlyDeliveryCount={monthlyCount} />
                    <div className="absolute top-2 right-2 z-10 group cursor-pointer" onClick={() => navigate('/loyalty-program')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle text-gray-900 hover:text-yellow-700 transition-colors"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                        <div className="absolute right-0 top-6 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-20">Details on stamp earning, rewards, and how tiers affect your goal.</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8 gap-8">
                
                <div className="md:col-span-1 order-1">
                    <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-100 relative" id="request-form-target"> 
                        <RequestForm 
                            formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handlePhoneInput={handlePhoneInput} 
                            timeStatus={timeStatus} isLate={isLate} total={total} subtotal={subtotal} discount={discount} 
                            editingId={editingId} loading={loading} isQuote={isQuote} busyIntervals={busyIntervals} 
                            jobProfile={currentJobProfile} cancelEdit={cancelEdit} 
                            receiptFile={receiptFile} handleReceiptChange={(e) => { if(e.target.files[0]) setReceiptFile(e.target.files[0]) }}
                        />
                    </div>
                </div>

                <div className="md:col-span-2 order-2 space-y-4" id="jobs-list-target">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">My Requests ({jobs.length})</h3>
                        <div className="flex flex-wrap justify-center sm:justify-end bg-gray-100 p-1 rounded-lg space-x-1" id="jobs-filter-target">
                            {['all', 'pending', 'accepted', 'delivered', 'rejected', 'cancelled'].map(status => (
                                <button key={status} onClick={() => { setFilter(status); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{status}</button>
                            ))}
                        </div>
                    </div>
                    
                    {filteredJobs.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><p className="text-gray-500">No {filter !== 'all' ? filter : ''} requests found.</p></div>}

                    <div className="space-y-4">
                        {paginatedJobs.map((job) => (
                            <ClientJobCard key={job.id} job={job} openCounterModal={openCounterModal} handleAcceptCounter={handleAcceptCounter} setViewProofJob={setViewProofJob} handleEdit={handleEdit} handleCancelJob={handleCancelJob} handleUpdateReceipt={handleUpdateReceipt} />
                        ))}
                    </div>

                    {/* NEW: Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 gap-3 pb-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-sm"
                            >
                                &larr; Previous
                            </button>
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-sm"
                            >
                                Next &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}