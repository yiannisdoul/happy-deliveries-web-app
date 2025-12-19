import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, DollarSign, Shield, TrendingUp, Maximize } from 'lucide-react'; 

export default function Landing() {
  const navigate = useNavigate();

  // Define the external dashboard URL
  const DASHBOARD_URL = "https://dashboard.happydeliveries.com.au";

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 lg:flex lg:items-center">
          
          {/* Text Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl md:text-6xl tracking-tight">
              <span className="block">Reliable delivery,</span>
              <span className="block text-blue-600">earn free service.</span> 
            </h1>
            <p className="mt-4 text-base text-gray-500 sm:text-lg md:text-xl max-w-2xl mx-auto lg:mx-0">
              Professional courier services with a rewarding loyalty program. 
              Unlock faster free deliveries with our status tiers and bank your rewards forever.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              
              {/* FIX 1: External Link to Dashboard App */}
              <button 
                onClick={() => window.location.href = `${DASHBOARD_URL}/signup`}
                className="w-full sm:w-auto px-8 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg font-bold text-lg"
              >
                Book a Delivery
              </button>

              {/* FIX 2: Internal Link to Loyalty Page (within Marketing Site) */}
              <button 
                onClick={() => navigate('/loyalty-program')} 
                className="w-full sm:w-auto px-8 py-3 text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 font-bold text-lg"
              >
                View Loyalty Perks
              </button>

            </div>
          </div>
          
          {/* Illustration Card */}
          <div className="mt-10 lg:mt-0 lg:w-1/2 lg:pl-12 flex justify-center">
             <div className="bg-blue-50 rounded-2xl p-6 transform rotate-2 shadow-xl border border-blue-100 max-w-sm w-full">
                <div className="space-y-4">
                  <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                    <CheckCircle className="text-green-500 h-6 w-6 mr-3"/>
                    <div>
                      <p className="font-bold text-slate-800">Delivery Confirmed</p>
                      <p className="text-xs text-gray-400">Owner accepted your request</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-lg shadow-sm opacity-90">
                    <Calendar className="text-blue-500 h-6 w-6 mr-3"/>
                    <div>
                      <p className="font-bold text-slate-800">Scheduled: Tomorrow</p>
                      <p className="text-xs text-gray-400">10:00 AM - 2:00 PM</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {icon: Maximize, color: 'text-yellow-600', bg: 'bg-yellow-100', title: 'Earn FREE Deliveries', desc: 'Our Loyalty Card tracks stamps to provide free service on every 5-10 jobs.'},
                {icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', title: 'Progressive Status Tiers', desc: 'Climb status levels (Dirt to Diamond) to permanently reduce the required stamps per reward.'},
                {icon: Shield, color: 'text-green-600', bg: 'bg-green-100', title: 'Rollover Protection', desc: 'Surplus deliveries roll over monthly, guaranteeing a head start toward your next tier status.'}
              ].map((f, i) => (
                <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 text-center md:text-left">
                  <div className={`h-12 w-12 ${f.bg} rounded-full flex items-center justify-center mb-4 ${f.color} mx-auto md:mx-0`}>
                    <f.icon />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-gray-500">{f.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}