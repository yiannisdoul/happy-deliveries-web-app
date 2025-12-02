import React, { useEffect, useState } from 'react';
import { Smile, Truck, LogOut, Settings, Phone, LayoutDashboard } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // To check which page we are on
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // Listen for auth changes AND fetch the user's name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch the Name from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().fullName) {
           setUserName(docSnap.data().fullName);
        } else {
           setUserName(currentUser.email); // Fallback to email if no name
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
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Determine where the "Dashboard" button should go
  const dashboardPath = user?.email === 'owner@delivery.com' ? '/owner' : '/client';
  const isOnDashboard = location.pathname === dashboardPath;

  return (
    <div className="sticky top-0 z-50">
      
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* BRANDING */}
            <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
              <Smile className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="font-bold text-xl tracking-tight text-blue-900 mr-2">Happy</span>
              <Truck className="h-8 w-8 text-blue-600 mr-1" />
              <span className="font-bold text-xl tracking-tight text-blue-900">Deliveries</span>
            </div>

            {/* USER MENU */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Name Display (Replaces Email) */}
                  <span className="hidden md:block text-sm font-semibold text-gray-700 capitalize max-w-[150px] truncate">
                    {userName}
                  </span>
                  
                  {/* Dashboard Button (Only if not currently on dashboard) */}
                  {!isOnDashboard && (
                    <button 
                      onClick={() => navigate(dashboardPath)}
                      className="p-2 text-blue-600 hover:text-blue-800 transition rounded-full hover:bg-blue-50"
                      title="Go to Dashboard"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                    </button>
                  )}

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
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-x-2 flex items-center">
                  <button onClick={() => navigate('/login')} className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                    Log In
                  </button>
                  <button onClick={() => navigate('/signup')} className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm">
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}