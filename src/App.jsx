import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import ClientDash from './pages/ClientDash';
import OwnerDash from './pages/OwnerDash';
import LoyaltyProgram from './pages/LoyaltyProgram';
import TierProgram from './pages/TierProgram';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

// --- ZONE A: THE DASHBOARD APP ---
// This only runs on dashboard.happydeliveries.com.au
function DashboardApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email && currentUser.email.toLowerCase() === 'admin@happydeliveries.com.au') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // 1. The "Smart Router" for the Root Path "/"
  const RootScreen = () => {
    if (!user) return <Login />;           // Not logged in? Show Login
    if (isAdmin) return <OwnerDash />;      // Admin? Show Owner Dash
    return <ClientDash />;                  // User? Show Client Dash
  };

  return (
    <Router>
      <Navbar mode="dashboard" /> {/* Pass "dashboard" mode to Navbar */}
      <Routes>
        <Route path="/" element={<RootScreen />} />
        
        {/* Support pages */}
        <Route path="/loyalty-program" element={<LoyaltyProgram />} />
        <Route path="/tier-program" element={<TierProgram />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Auth pages (internal navigation) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login isSignup={true} />} />

        {/* Catch-all: Send everything else back to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// --- ZONE B: THE MARKETING SITE ---
// This only runs on happydeliveries.com.au
function MarketingSite() {
  return (
    <Router>
      <Navbar mode="landing" /> {/* Pass "landing" mode to Navbar */}
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Any other public pages go here */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// --- MAIN ENTRY POINT ---
export default function App() {
  const hostname = window.location.hostname;
  
  // Check if we are on the dashboard subdomain (or localhost for testing)
  // You can toggle 'localhost' logic if you want to test Landing page locally
  const isDashboard = hostname.includes('dashboard') || hostname.includes('localhost');

  if (isDashboard) {
    return <DashboardApp />;
  } else {
    return <MarketingSite />;
  }
}