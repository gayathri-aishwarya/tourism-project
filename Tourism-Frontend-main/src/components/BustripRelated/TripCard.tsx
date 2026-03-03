'use client'

import { useRouter } from 'next/navigation';
import { FaClock, FaChair, FaArrowRight } from 'react-icons/fa';
import { TripInstance } from '@/src/types/busbooking';

interface Props {
  trip: TripInstance;
}

export default function TripCard({ trip }: Props) {
  const router = useRouter();
  
  const template = typeof trip.trip_template_id === 'object' 
    ? trip.trip_template_id 
    : null;
  
  if (!template) return null;

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleSelect = () => {
    router.push(`/buses/${trip._id}`);
  };

  const isAvailable = trip.available_seats > 0 && trip.status === 'active';
  const seatStatus = trip.available_seats > 20 ? 'high' : trip.available_seats > 5 ? 'medium' : 'low';

  return (
    <div className="trip-card">
      <div className="trip-info">
        <div className="trip-route">
          <span className="route-point">{template.from_location}</span>
          <FaArrowRight className="route-arrow" />
          <span className="route-point">{template.to_location}</span>
          <span className="seats-available high">
            {trip.available_seats} seats
          </span>
        </div>
        
        <div className="trip-time">
          <FaClock />
          <span>{formatTime(template.departure_time)} • {formatDate(trip.travel_date)}</span>
        </div>
      </div>

      <div className="trip-details">
        <div className="detail-row">
          <FaChair />
          <span>Duration: {Math.floor(template.duration / 60)}h {template.duration % 60}m</span>
        </div>
      </div>

      <div className="trip-price">
        <span className="price-label">Starting from</span>
        <span className="price-amount">EGP {template.ticket_price}</span>
        <button
          className="select-btn"
          onClick={handleSelect}
          disabled={!isAvailable}
        >
          {isAvailable ? 'Select Seats' : 'Sold Out'}
        </button>
      </div>
    </div>
  );
}