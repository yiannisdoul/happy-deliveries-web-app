import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import ClientDash from './pages/ClientDash';
import LoyaltyProgram from './pages/LoyaltyProgram';
import TierProgram from './pages/TierProgram';
import OwnerDash from './pages/OwnerDash';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login isSignup={true} />} />
        <Route path="/client" element={<ClientDash />} />
        <Route path="/loyalty-program" element={<LoyaltyProgram />} />
        <Route path="/tier-program" element={<TierProgram />} />
        <Route path="/owner" element={<OwnerDash />} />
        <Route path="/settings" element={<Settings />} /> {/* New Route */}
      </Routes>
    </Router>
  );
}

export default App;