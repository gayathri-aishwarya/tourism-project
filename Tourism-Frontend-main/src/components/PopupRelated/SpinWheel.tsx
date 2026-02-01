'use client';

import React, { useState } from 'react';
import { WheelOfFortune } from '@matmachry/react-wheel-of-fortune';

interface SpinWheelProps {
  phone: string;
  setPhone: (phone: string) => void;
  onSpinComplete: () => void;
  validatePhone: (phone: string) => boolean;
  discountAmount: number;
}

const SpinWheel: React.FC<SpinWheelProps> = ({
  phone,
  setPhone,
  onSpinComplete,
  validatePhone,
  discountAmount
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [winner, setWinner] = useState<any>(null);

  const segments = [
    { id: 1, text: '🏨 Hotel Reservations', color: '#FF6B35' },
    { id: 2, text: '✈️ Flight Bookings', color: '#004E89' },
    { id: 3, text: '🚗 Transportation', color: '#00A896' },
    { id: 4, text: '🛂 Visa Assistance', color: '#FFD166' },
    { id: 5, text: '🎫 Tour Packages', color: '#EF476F' }
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    
    // Auto-format: 01X XXX XXXX
    if (value.length === 3 || value.length === 7) {
      setPhone(value + ' ');
    }
    
    setPhoneError('');
  };

  const handleSpin = () => {
    if (!phone.trim()) {
      setPhoneError('Please enter your phone number');
      return;
    }
    
    if (!validatePhone(phone.replace(/\s/g, ''))) {
      setPhoneError('Please enter a valid Egyptian number (01XXXXXXXXX)');
      return;
    }
    
    setIsSpinning(true);
    // The WheelOfFortune component handles its own spinning animation
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSpinEnd = (winner: any) => {
    setWinner(winner);
    setIsSpinning(false);
    setTimeout(() => {
      onSpinComplete();
    }, 1000);
  };

  return (
    <div className="wheel-container p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Spin to Win Your Discount! 🎡
      </h2>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Phone Input Section */}
        <div className="lg:w-2/5">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Your Egyptian Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="01X XXX XXXX"
              maxLength={11}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg"
              disabled={isSpinning}
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-2">{phoneError}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Example: 010 222 28556
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">🎁 How It Works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Enter your Egyptian mobile number</li>
              <li>2. Spin the wheel</li>
              <li>3. Win discount = sum of your phone digits!</li>
              <li>4. Fill form to get your discount code</li>
            </ul>
          </div>

          {discountAmount > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-semibold">
                Your potential discount: <span className="text-2xl">{discountAmount} EGP</span>
              </p>
              <p className="text-sm text-green-600 mt-1">
                (Sum of digits: {phone.split('').filter(c => /\d/.test(c)).join('+')})
              </p>
            </div>
          )}
        </div>

        {/* Wheel Section */}
        <div className="lg:w-3/5 flex flex-col items-center">
          <div className="relative mb-6">
            {/* @ts-ignore - Library has outdated types */}
            <WheelOfFortune
              segments={segments}
              onSpinEnd={handleSpinEnd}
              spinDuration={3000}
              showPointer={true}
              width={400}
              height={400}
            />
          </div>
          
          <button
            onClick={handleSpin}
            disabled={isSpinning || !phone.trim()}
            className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isSpinning ? 'Spinning...' : '🎯 SPIN TO WIN!'}
          </button>
          
          {winner && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold">
                🎉 You won: {winner.text}!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;

