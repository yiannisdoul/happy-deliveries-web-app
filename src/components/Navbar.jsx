import React, { useEffect, useState } from 'react';
import { Smile, Truck, LogOut, Settings, Phone, LayoutDashboard, Menu, X } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import TutorialOverlay from './Client/TutorialOverlay';

// "mode" prop will be either 'landing' or 'dashboard'
export default function Navbar({ mode = 'dashboard' }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); 

  // CONSTANTS
  const DASHBOARD_URL = "https://dashboard.happydeliveries.com.au";
  const LANDING_URL = "https://happydeliveries.com.au";

  // --- LOGIC: Only run Auth checks if we are in DASHBOARD mode ---
  useEffect(() => {
    if (mode === 'landing') return; // Don't check auth on landing page

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        setUserName(docSnap.exists() && docSnap.data().fullName ? docSnap.data().fullName : currentUser.email);

        // Tutorial Logic
        const isOwner = currentUser.email === 'admin@happydeliveries.com.au';
        const hasSeen = localStorage.getItem('tutorial_completed') === 'true';
        if (!isOwner && !hasSeen && location.pathname === '/') {
            setIsTutorialActive(true);
            setCurrentStep(1);
        }
      }
    });
    return () => unsubscribe();
  }, [mode, location.pathname]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = LANDING_URL; // Send back to main site on logout
  };

  // Helper to go to dashboard (External Link if on landing, Internal if on dashboard)
  const goToDashboard = () => {
    if (mode === 'landing') {
      window.location.href = DASHBOARD_URL;
    } else {
      navigate('/');
    }
  };

  // Helper for Login/Signup buttons
  const goToLogin = () => window.location.href = `${DASHBOARD_URL}/login`;
  const goToSignup = () => window.location.href = `${DASHBOARD_URL}/signup`;

  return (
    <div className="sticky top-0 z-50">
      {/* Tutorial Overlay (Dashboard Only) */}
      {mode === 'dashboard' && location.pathname === '/' && isTutorialActive && (
          <TutorialOverlay currentStep={currentStep} setCurrentStep={setCurrentStep} isTutorialActive={isTutorialActive} setIsTutorialActive={setIsTutorialActive} />
      )}
      
      {/* Top Bar */}
      <div className="bg-amber-100 text-amber-900 text-xs sm:text-sm py-2 text-center font-medium border-b border-amber-200">
        <div className="flex items-center justify-center gap-2">
          <Phone className="h-3 w-3" />
          <span>Questions? Call us on <b>+61 420 882 302</b></span>
        </div>
      </div>

      <nav className="bg-white shadow-sm relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* BRANDING */}
            <div className="flex items-center cursor-pointer" onClick={() => window.location.href = LANDING_URL}>
              <Smile className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="font-bold text-xl text-blue-900 mr-2">Happy</span>
              <Truck className="h-8 w-8 text-blue-600 mr-1" />
              <span className="font-bold text-xl text-blue-900">Deliveries</span>
            </div>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center space-x-4">
              {mode === 'dashboard' && user ? (
                /* LOGGED IN DASHBOARD VIEW */
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 capitalize max-w-[150px] truncate">{userName}</span>
                  <button onClick={goToDashboard} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Dashboard"><LayoutDashboard className="h-5 w-5" /></button>
                  <button onClick={() => navigate('/settings')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Settings"><Settings className="h-5 w-5" /></button>
                  <button onClick={handleLogout} className="flex items-center text-sm font-medium text-gray-700 hover:text-red-600 ml-1"><LogOut className="h-4 w-4 mr-1" /> Sign Out</button>
                </div>
              ) : (
                /* PUBLIC / LANDING VIEW */
                <div className="space-x-2">
                  <button onClick={goToLogin} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Log In</button>
                  <button onClick={goToSignup} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Sign Up</button>
                </div>
              )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <div className="md:hidden flex items-center">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>
          </div>
        </div>
        
        {/* MOBILE DROPDOWN (Simplified for brevity, follows same logic) */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full px-4 py-4 flex flex-col space-y-3 z-40">
                {mode === 'dashboard' && user ? (
                    <>
                        <div className="font-bold text-gray-800">{userName}</div>
                        <button onClick={goToDashboard} className="flex items-center py-2 text-gray-700"><LayoutDashboard className="h-5 w-5 mr-3"/> Dashboard</button>
                        <button onClick={() => navigate('/settings')} className="flex items-center py-2 text-gray-700"><Settings className="h-5 w-5 mr-3"/> Settings</button>
                        <button onClick={handleLogout} className="flex items-center py-2 text-red-600"><LogOut className="h-5 w-5 mr-3"/> Sign Out</button>
                    </>
                ) : (
                    <>
                        <button onClick={goToLogin} className="w-full py-3 border rounded-lg">Log In</button>
                        <button onClick={goToSignup} className="w-full py-3 bg-blue-600 text-white rounded-lg">Sign Up</button>
                    </>
                )}
            </div>
        )}
      </nav>
    </div>
  );
}