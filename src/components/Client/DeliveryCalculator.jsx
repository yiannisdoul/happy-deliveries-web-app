import React, { useState, useEffect } from 'react';

const DeliveryCalculator = ({ onUpdate, initialDistance = 50 }) => {
  // 1. State Management (Inputs stored as strings to prevent the '0 glitch' when deleting)
  const [weightBracket, setWeightBracket] = useState(1); // 1, 2, 3, or 4
  const [distance, setDistance] = useState(initialDistance ? initialDistance.toString() : '');
  const [flights, setFlights] = useState('0');
  const [difficultAccess, setDifficultAccess] = useState(false);
  
  // 2. Synchronous Math (Calculated every render automatically)
  let trips = 1;
  let baseFee = 60;
  let isQuote = false;
  let weightLabel = "< 1.25";
  let quoteReason = "";

  // Parse strings to numbers safely for calculations
  const distNum = parseInt(distance, 10) || 0;
  const flightsNum = parseInt(flights, 10) || 0;

  // Bracket Logic
  if (weightBracket === 1) { 
      trips = 1; baseFee = 60; weightLabel = "< 1.25"; 
  } else if (weightBracket === 2) { 
      trips = 2; baseFee = 105; weightLabel = "1.25 - 2.50"; 
  } else if (weightBracket === 3) { 
      trips = 3; baseFee = 150; weightLabel = "2.50 - 3.75"; 
  } else { 
      trips = 0; baseFee = 0; weightLabel = "3.75+"; 
      isQuote = true; 
      quoteReason = "Weight exceeds 3.75 Tonnes."; 
  }

  // Long Distance Logic Limit
  if (distNum > 250) {
      isQuote = true;
      quoteReason = weightBracket === 4 
          ? "Weight and distance exceed standard limits." 
          : "Distance exceeds 250km limit.";
  }

  // Tapered Distance Logic (Per Trip)
  let perTripDistCost = 0;
  let remainingDist = distNum;

  if (remainingDist > 150) {
      perTripDistCost += (remainingDist - 150) * 1.80;
      remainingDist = 150;
  }
  if (remainingDist > 50) {
      perTripDistCost += (remainingDist - 50) * 2.10;
      remainingDist = 50;
  }
  if (remainingDist > 0) {
      perTripDistCost += remainingDist * 2.50;
  }

  // Multipliers & Final Totals
  const totalDistCost = isQuote ? 0 : perTripDistCost * trips;
  const stairsCost = isQuote ? 0 : 20 * flightsNum * trips;
  const diffAccessCost = (difficultAccess && !isQuote) ? 30 : 0;
  const accessTotal = stairsCost + diffAccessCost;
  
  const totalCost = isQuote ? 0 : baseFee + totalDistCost + accessTotal;

  const currentCalcs = {
    weight: weightLabel, 
    distance: distNum, // Pass the clean number to the parent
    trips,
    tripStandardCost: baseFee,
    distanceCost: totalDistCost,
    accessCost: accessTotal,
    baseTotal: totalCost,
    isQuote
  };

  // 3. Notify Parent Component safely without looping
  useEffect(() => {
    if (onUpdate) {
      onUpdate(currentCalcs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightBracket, distNum, flightsNum, difficultAccess]);

  return (
    <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 space-y-6">
      
      {/* --- 1. White-Glove Label --- */}
      <div className="text-center pt-2">
        <p className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-100 inline-block px-4 py-2 rounded-full uppercase tracking-wide shadow-sm">
           White-Glove Service: Includes manual handling, inside delivery, and multi-trip discounts.
        </p>
      </div>

      {/* --- 2. Locked Weight Slider (4 Steps) --- */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-blue-800 uppercase">Weight Bracket</label>
          <span className="text-sm font-bold text-blue-900 bg-white px-2 py-0.5 rounded shadow-sm">
            {weightLabel} {weightBracket !== 4 && 'Tonnes'}
          </span>
        </div>
        
        <input 
          type="range" min="1" max="4" step="1" 
          value={weightBracket} 
          onChange={(e) => setWeightBracket(parseInt(e.target.value))} 
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-blue-600 font-bold px-1 mt-2">
            <span>&lt; 1.25t</span>
            <span className="ml-2">2.50t</span>
            <span className="ml-5">3.75t</span>
            <span>Quote</span>
        </div>
      </div>

      {/* --- 3. Trip/Distance Summary --- */}
      {!currentCalcs.isQuote && (
        <div className="text-center pb-2">
          <p className="text-sm font-bold text-blue-700">
            {currentCalcs.trips} Trip{currentCalcs.trips > 1 ? 's' : ''} (${currentCalcs.tripStandardCost.toFixed(2)}) 
            {' '} + Dist. (${currentCalcs.distanceCost.toFixed(2)})
            {currentCalcs.accessCost > 0 && ` + Access ($${currentCalcs.accessCost.toFixed(2)})`}
          </p>
        </div>
      )}

      {/* --- 4. Distance Input --- */}
      <div>
        <label className="text-xs font-bold text-blue-800 uppercase block mb-2">Distance (km)</label>
        <input 
          type="number" min="0" step="1" 
          value={distance} 
          onChange={(e) => setDistance(e.target.value)}
          placeholder="e.g., 45"
          className="w-full text-sm p-3 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
      </div>

      {/* --- 5. Additional Access Options --- */}
      <div>
        <label className="text-xs font-bold text-blue-800 uppercase block mb-3">Access Surcharges</label>
        
        <div className="space-y-3">
            {/* Flights Input */}
            <div className="flex items-center justify-between p-3 bg-white rounded border border-blue-100 shadow-sm focus-within:border-blue-400 transition-colors">
                <span className="text-sm font-medium text-blue-900">Flights of Stairs ($20/flight per trip)</span>
                <input 
                    type="number" min="0" step="1" 
                    value={flights}
                    onChange={(e) => setFlights(e.target.value)}
                    placeholder="0"
                    className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Difficult Access Toggle */}
            <label className="flex items-center text-sm font-medium text-blue-900 cursor-pointer p-3 bg-white rounded border border-blue-100 shadow-sm hover:border-blue-300 transition-colors">
                <input 
                    type="checkbox" 
                    checked={difficultAccess} 
                    onChange={(e) => setDifficultAccess(e.target.checked)} 
                    className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
                Difficult Access / Long Carry (Flat $30 fee)
            </label>
        </div>
      </div>

      {/* --- 6. Bottom Focal Point: Total Pricing --- */}
      <div className="text-center pt-6 border-t-2 border-blue-200">
        {currentCalcs.isQuote ? (
          <div className="animate-pulse py-2">
            <h2 className="text-2xl font-extrabold text-yellow-600 mb-1">Special Quote Required</h2>
            <p className="text-sm text-yellow-800 font-medium">{quoteReason}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Estimated Total</p>
            <h2 className="text-6xl font-black text-blue-900 tracking-tight">${currentCalcs.baseTotal.toFixed(2)}</h2>
          </div>
        )}
      </div>

    </div>
  );
};

export default DeliveryCalculator;