import React, { useEffect, useState } from 'react';
import { Smile, Truck, LogOut, Settings, Phone, LayoutDashboard, Menu, X } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// NEW IMPORT
import TutorialOverlay from './Client/TutorialOverlay';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // --- MOBILE MENU STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- TUTORIAL STATE ---
  const [isTutorialActive, setIsTutorialActive] = useState(
      localStorage.getItem('tutorial_completed') !== 'true'
  ); 
  const [currentStep, setCurrentStep] = useState(1); 
  // --------------------------

  // Listen for auth changes AND fetch the user's name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().fullName) {
           setUserName(docSnap.data().fullName);
        } else {
           setUserName(currentUser.email);
        }
      } else {
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false); // Close menu on logout
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  
  const handleRestartTutorial = () => {
      localStorage.removeItem('tutorial_completed'); 
      setCurrentStep(1);
      setIsTutorialActive(true);
      setIsMobileMenuOpen(false); // Close menu so they can see tutorial
  };

  const handleNavigation = (path) => {
      navigate(path);
      setIsMobileMenuOpen(false);
  };

  // Determine paths and visibility
  const dashboardPath = user?.email === 'owner@delivery.com' ? '/owner' : '/client';
  const isOnDashboard = location.pathname === dashboardPath;
  const isClientPage = user?.email !== 'owner@delivery.com' && (location.pathname === '/client' || location.pathname.startsWith('/client/'));

  return (
    <div className="sticky top-0 z-50">
      
      {/* RENDER TUTORIAL OVERLAY */}
      <TutorialOverlay
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        isTutorialActive={isTutorialActive}
        setIsTutorialActive={setIsTutorialActive}
      />
      
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-amber-100 text-amber-900 text-xs sm:text-sm py-2 text-center font-medium border-b border-amber-200">
        <div className="flex items-center justify-center gap-2">
          <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>
            Questions? Call us on{' '}
            <a href="tel:+61420882302" className="font-bold underline decoration-amber-500 hover:text-amber-700">
              +61 420 882 302
            </a>
          </span>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className="bg-white shadow-sm relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* BRANDING */}
            <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => handleNavigation('/')}>
              <Smile className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="font-bold text-xl tracking-tight text-blue-900 mr-2">Happy</span>
              <Truck className="h-8 w-8 text-blue-600 mr-1" />
              <span className="font-bold text-xl tracking-tight text-blue-900">Deliveries</span>
            </div>

            {/* ========================================= */}
            {/* DESKTOP MENU (Hidden on Mobile)           */}
            {/* ========================================= */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Name Display */}
                  <span className="text-sm font-semibold text-gray-700 capitalize max-w-[150px] truncate">
                    {userName}
                  </span>
                  
                  {/* Tutorial Button */}
                  {isClientPage && (
                    <button 
                      onClick={handleRestartTutorial}
                      className="text-xs bg-blue-500 text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
                    >
                      Tutorial 
                    </button>
                  )}
                  
                  {/* Dashboard Button */}
                  {!isOnDashboard && (
                    <button 
                      onClick={() => navigate(dashboardPath)}
                      className="p-2 text-blue-600 hover:text-blue-800 transition rounded-full hover:bg-blue-50"
                      title="Go to Dashboard"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                    </button>
                  )}
                  
                  {/* Settings Button */}
                  <button 
                    onClick={() => navigate('/settings')}
                    className="p-2 text-gray-600 hover:text-blue-600 transition rounded-full hover:bg-gray-100"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-red-600 transition ml-1"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-x-2 flex items-center">
                  <button onClick={() => navigate('/login')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                    Log In
                  </button>
                  <button onClick={() => navigate('/signup')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm">
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* ========================================= */}
            {/* MOBILE HAMBURGER BUTTON (Visible < md)    */}
            {/* ========================================= */}
            <div className="md:hidden flex items-center">
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-gray-600 hover:text-blue-600 focus:outline-none p-2"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* MOBILE DROPDOWN MENU                      */}
        {/* ========================================= */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 z-40 px-4 py-4 flex flex-col space-y-4">
                {user ? (
                    <>
                        {/* User Info Block */}
                        <div className="flex flex-col border-b border-gray-100 pb-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Signed in as</span>
                            <span className="text-lg font-bold text-gray-800 capitalize">{userName}</span>
                        </div>

                        {/* Navigation Items */}
                        <div className="flex flex-col space-y-3">
                            {!isOnDashboard && (
                                <button 
                                    onClick={() => handleNavigation(dashboardPath)}
                                    className="flex items-center text-gray-700 hover:text-blue-600 py-2"
                                >
                                    <LayoutDashboard className="h-5 w-5 mr-3" />
                                    Dashboard
                                </button>
                            )}

                            {/* Mobile Tutorial Button */}
                            {isClientPage && (
                                <button 
                                    onClick={handleRestartTutorial}
                                    className="flex items-center justify-between w-full bg-blue-50 text-blue-700 px-4 py-3 rounded-lg font-semibold"
                                >
                                    <span>Tutorial</span>
                                    <Smile className="h-5 w-5" />
                                </button>
                            )}

                            <button 
                                onClick={() => handleNavigation('/settings')}
                                className="flex items-center text-gray-700 hover:text-blue-600 py-2"
                            >
                                <Settings className="h-5 w-5 mr-3" />
                                Settings
                            </button>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-3">
                            <button 
                                onClick={handleLogout}
                                className="flex items-center text-red-600 hover:text-red-700 font-medium w-full py-2"
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                Sign Out
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col space-y-3">
                        <button onClick={() => handleNavigation('/login')} className="w-full text-center py-3 border border-gray-300 rounded-lg text-gray-700 font-medium">
                            Log In
                        </button>
                        <button onClick={() => handleNavigation('/signup')} className="w-full text-center py-3 bg-blue-600 text-white rounded-lg font-medium">
                            Sign Up
                        </button>
                    </div>
                )}
            </div>
        )}
      </nav>
    </div>
  );
}