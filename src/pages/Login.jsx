import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore'; 
import { auth, db } from '../config/firebase';

export default function Login({ isSignup = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePhoneInput = (val) => {
    // Digits only, Max 9
    const numericOnly = val.replace(/\D/g, '');
    if (numericOnly.length <= 9) {
      setPhone(numericOnly);
    }
  };

  const handleAuth = async () => {
    if (!auth) return setError("Firebase not connected.");
    
    if (isSignup) {
       // Just a sanity check in case they submitted empty or partial
       if (phone.length < 9) return setError("Phone number must be 9 digits.");
    }

    setLoading(true);
    setError('');
    
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          fullName: fullName,
          phone: phone,
          role: 'client' 
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      if (email === 'owner@delivery.com') navigate('/owner');
      else navigate('/client');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-center text-3xl font-extrabold text-blue-900 mb-2">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        
        <div className="space-y-4 mt-6">
          {error && <div className="bg-red-50 text-red-600 p-3 text-sm rounded border-l-4 border-red-500">{error}</div>}
          
          {isSignup && (
            <>
              <input type="text" placeholder="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              <div className="flex rounded-lg shadow-sm">
                 <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">+61</span>
                 <input 
                   type="text" 
                   inputMode="numeric"
                   placeholder="4XX XXX XXX" 
                   required 
                   value={phone} 
                   onChange={e => handlePhoneInput(e.target.value)}
                   className="flex-1 w-full px-4 py-3 rounded-r-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                 />
              </div>
            </>
          )}
          
          <input type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <button onClick={handleAuth} disabled={loading}
            className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-lg transition transform active:scale-95">
            {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
          
          <button onClick={() => navigate(isSignup ? '/login' : '/signup')} className="w-full text-center text-sm text-blue-600 font-medium hover:underline mt-2">
             {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}