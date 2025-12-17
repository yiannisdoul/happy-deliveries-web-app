import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore'; 
import { auth, db } from '../config/firebase';
import { sendNotificationEmail, TEMPLATES } from '../utils/emailService';

export default function Login({ isSignup = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success messages like Password Reset
  const navigate = useNavigate();

  // --- FORGOT PASSWORD LOGIC ---
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address in the field above first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Please check your inbox.");
      setError('');
    } catch (err) {
      console.error(err);
      setError("Failed to send reset link. Please check if the email is correct.");
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      if (isSignup) {
        // --- SIGN UP LOGIC ---
        
        // 1. Validation
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 9) throw new Error("Phone number must be at least 9 digits.");
        if (!fullName.trim()) throw new Error("Full Name is required.");

        // 2. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. IMMEDIATE DATABASE WRITE (Fixes empty settings issue)
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email.toLowerCase(),
          fullName: fullName.trim(),
          phone: cleanPhone,
          role: 'client',
          stamps: 0,
          rewardCount: 0,
          monthly_delivery_count: 0,
          createdAt: new Date().toISOString()
        });
        
        // 4. Send Welcome Email (Points to clean Dashboard URL)
        await sendNotificationEmail(TEMPLATES.CLIENT_STATUS_UPDATE, {
            to_name: fullName,
            to_email: email,
            subject: "Welcome to Happy Deliveries!",
            message: "Your account is ready. You can now manage your deliveries at our dashboard.",
            status: "Account Active",
            link: "https://dashboard.happydeliveries.com.au/" 
        });

      } else {
        // --- LOGIN LOGIC ---
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // --- SUCCESS NAVIGATION ---
      // Since we are strictly on the dashboard domain, we just go to Root.
      // App.jsx will automatically show the Client or Owner view based on the user.
      navigate('/');

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-blue-900 mb-6">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        
        <div className="space-y-4">
          {/* Error & Success Messages */}
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border-l-4 border-red-500">{error}</div>}
          {message && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border-l-4 border-green-500">{message}</div>}

          {/* Signup Fields */}
          {isSignup && (
            <>
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
              />
              
              <div className="flex rounded-lg shadow-sm">
                 <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 font-bold text-sm">+61</span>
                 <input 
                   type="text" 
                   inputMode="numeric"
                   placeholder="4XX XXX XXX" 
                   required 
                   className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                   value={phone} 
                   onChange={e => setPhone(e.target.value)} 
                 />
              </div>
            </>
          )}

          {/* Common Fields */}
          <input 
            type="email" 
            placeholder="Email address" 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />

          {/* Main Action Button */}
          <button 
            onClick={handleAuth} 
            disabled={loading}
            className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
          
          {/* Forgot Password Link (Login Only) */}
          {!isSignup && (
            <button 
              onClick={handleForgotPassword} 
              className="w-full text-center text-sm text-blue-600 font-medium hover:underline mt-2"
            >
              Forgot Password?
            </button>
          )}

          {/* Toggle Login/Signup */}
          <button 
            onClick={() => {
                navigate(isSignup ? '/login' : '/signup');
                setError('');
                setMessage('');
            }} 
            className="w-full text-center text-sm text-gray-500 hover:text-blue-600 mt-4 transition-colors"
          >
             {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}