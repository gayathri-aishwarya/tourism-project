// src/components/BustripRelated/SeatLayout.tsx
'use client'

import { useState } from 'react';

interface Seat {
  number: string;
  isBooked: boolean;
  isAvailable: boolean;
}

interface Props {
  seats: { [key: string]: Seat };
  selected: string[];
  onToggle: (seat: string) => void;
  busType?: string;
  maxSelect?: number;
}

export default function SeatLayout({
  seats,
  selected,
  onToggle,
  busType = 'seater',
  maxSelect = 6
}: Props) {
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');

  // Group seats by deck if sleeper
  const hasDecks = busType === 'sleeper' || busType === 'semi-sleeper';
  
  const seatEntries = Object.entries(seats);
  const lowerSeats = hasDecks 
    ? seatEntries.slice(0, Math.floor(seatEntries.length / 2))
    : seatEntries;
  const upperSeats = hasDecks
    ? seatEntries.slice(Math.floor(seatEntries.length / 2))
    : [];

  const currentSeats = activeDeck === 'lower' ? lowerSeats : upperSeats;

  const handleClick = (seatNumber: string, seat: Seat) => {
    if (!seat.isAvailable || seat.isBooked) return;
    
    if (selected.includes(seatNumber)) {
      onToggle(seatNumber); // Deselect
    } else if (selected.length < maxSelect) {
      onToggle(seatNumber); // Select
    }
  };

  return (
    <div className="seat-layout">
      {hasDecks && (
        <div className="deck-selector">
          <button
            className={activeDeck === 'lower' ? 'active' : ''}
            onClick={() => setActiveDeck('lower')}
          >
            Lower Deck
          </button>
          <button
            className={activeDeck === 'upper' ? 'active' : ''}
            onClick={() => setActiveDeck('upper')}
          >
            Upper Deck
          </button>
        </div>
      )}

      <div className="seats-grid">
        {currentSeats.map(([seatNumber, seat]) => (
          <button
            key={seatNumber}
            className={`seat 
              ${seat.isBooked ? 'booked' : ''} 
              ${selected.includes(seatNumber) ? 'selected' : ''}
              ${!seat.isAvailable && !seat.isBooked ? 'unavailable' : ''}
            `}
            onClick={() => handleClick(seatNumber, seat)}
            disabled={!seat.isAvailable || seat.isBooked}
          >
            {seatNumber}
          </button>
        ))}
      </div>

      <div className="legend">
        <div><span className="available-box"></span> Available</div>
        <div><span className="selected-box"></span> Selected</div>
        <div><span className="booked-box"></span> Booked</div>
      </div>
    </div>
  );
}