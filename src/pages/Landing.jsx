import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, DollarSign, Shield } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 lg:flex lg:items-center">
          
          {/* Text Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl md:text-6xl tracking-tight">
              <span className="block">Reliable delivery</span>
              <span className="block text-blue-600">when you need it.</span>
            </h1>
            <p className="mt-4 text-base text-gray-500 sm:text-lg md:text-xl max-w-2xl mx-auto lg:mx-0">
              Professional courier services for your business or personal needs. 
              We accept cash or bank transfer. Simple, fast, and secure.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <button onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg font-bold text-lg">
                Book a Delivery
              </button>
              <button onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-lg">
                Log In
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
                {icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100', title: 'Flexible Payment', desc: 'Pay via cash upon pickup or bank transfer.'},
                {icon: Shield, color: 'text-green-600', bg: 'bg-green-100', title: 'Verified Transport', desc: 'Your goods are handled with care by pros.'},
                {icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100', title: 'Instant Scheduling', desc: 'Request a slot and get confirmation directly.'}
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