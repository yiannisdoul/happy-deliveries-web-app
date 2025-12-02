import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; 

export default function Settings() {
  const [formData, setFormData] = useState({ fullName: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePhoneInput = (val) => {
    const numericOnly = val.replace(/\D/g, '');
    if (numericOnly.length <= 9) {
      setFormData({ ...formData, phone: numericOnly });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 9) return alert("Phone number must be 9 digits.");

    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: formData.fullName,
        phone: formData.phone
      }, { merge: true });
      
      alert("Profile Updated!");
      navigate(0); // Refresh to update Navbar name
    } catch (error) {
      console.error("Error updating:", error);
      alert("Error updating profile.");
    }
  };

  // --- DYNAMIC BACK NAVIGATION ---
  const handleBack = () => {
    if (auth.currentUser?.email === 'owner@delivery.com') {
      navigate('/owner');
    } else {
      navigate('/client');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      
      {/* UPDATED BACK BUTTON */}
      <button 
        onClick={handleBack} 
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6 text-gray-900">Account Settings</h1>
      
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-5">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 outline-none" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex rounded-lg shadow-sm">
               <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">+61</span>
               <input 
                 type="text" 
                 inputMode="numeric"
                 value={formData.phone} 
                 onChange={e => handlePhoneInput(e.target.value)}
                 className="flex-1 w-full border border-gray-300 rounded-r-lg p-3 focus:ring-blue-500 outline-none" 
               />
            </div>
            <p className="text-xs text-gray-400 mt-1">Digits only (max 9 digits)</p>
        </div>
        <button type="submit" className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-sm">Save Changes</button>
      </form>
    </div>
  );
}