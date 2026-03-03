// src/components/BusbookingRelated/PassengerForm.tsx
'use client'

import { useState } from 'react';

interface Passenger {
  seat_number: string;
  name: string;
  age: number | '';
}

interface Props {
  seats: Array<{ seat_number: string; price: number }>;
  onSubmit: (data: {
    passengers: Array<{ seat_number: string; name: string; age: number }>;
    phone: string;
  }) => void;
  onCancel: () => void;
}

export default function PassengerForm({ seats, onSubmit, onCancel }: Props) {
  const [passengers, setPassengers] = useState<Passenger[]>(
    seats.map(seat => ({
      seat_number: seat.seat_number,
      name: '',
      age: ''
    }))
  );
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate phone (Egyptian)
    const egyptPhoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!egyptPhoneRegex.test(phone)) {
      newErrors.phone = 'Enter a valid Egyptian mobile number';
    }

    // Validate each passenger
    passengers.forEach((p, index) => {
      if (!p.name.trim()) {
        newErrors[`name_${index}`] = 'Name required';
      }
      if (!p.age) {
        newErrors[`age_${index}`] = 'Age required';
      } else if (p.age < 0 || p.age > 120) {
        newErrors[`age_${index}`] = 'Invalid age';
      }
    });

    // Check adult supervision (under 10 needs adult)
    const hasAdult = passengers.some(p => p.age >= 10);
    const hasChild = passengers.some(p => p.age < 10);
    
    if (hasChild && !hasAdult) {
      newErrors.general = 'Children under 10 must be with an adult';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        passengers: passengers.map(p => ({
          seat_number: p.seat_number,
          name: p.name,
          age: Number(p.age)
        })),
        phone
      });
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string | number) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const totalFare = seats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <form onSubmit={handleSubmit} className="passenger-form">
      <h2>Passenger Details</h2>

      {errors.general && (
        <div className="error-general">{errors.general}</div>
      )}

      <div className="phone-field">
        <label>Contact Phone (Egyptian)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01012345678"
        />
        {errors.phone && <span className="error">{errors.phone}</span>}
      </div>

      {passengers.map((passenger, index) => (
        <div key={index} className="passenger-card">
          <h3>Seat {passenger.seat_number}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={passenger.name}
                onChange={(e) => updatePassenger(index, 'name', e.target.value)}
              />
              {errors[`name_${index}`] && (
                <span className="error">{errors[`name_${index}`]}</span>
              )}
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={passenger.age}
                onChange={(e) => updatePassenger(index, 'age', parseInt(e.target.value) || '')}
                min="0"
                max="120"
              />
              {errors[`age_${index}`] && (
                <span className="error">{errors[`age_${index}`]}</span>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="total-fare">
        <span>Total Fare:</span>
        <strong>EGP {totalFare}</strong>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Confirm Booking</button>
      </div>
    </form>
  );
}