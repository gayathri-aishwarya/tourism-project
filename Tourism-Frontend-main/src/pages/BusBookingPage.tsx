import { useState } from "react";
import SeatLayout from "../components/BustripRelated/SeatLayout";
import PassengerForm from "../components/BusbookingRelated/PassengerForm";
import BusBookingSummary from "../components/BusbookingRelated/BusBookingSummary";
import { BusBookingSeat } from "../types/busbooking";

export default function BusBookingPage() {
  const seats = ["1","2","3","4","5","6"];
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Record<string, BusBookingSeat>>({});

  const toggleSeat = (seat: string) => {
    setSelectedSeats(prev =>
      prev.includes(seat)
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  const updatePassenger = (
    seat: string,
    field: keyof BusBookingSeat,
    value: string | number
  ) => {
    setPassengers(prev => ({
      ...prev,
      [seat]: {
        ...prev[seat],
        seat_number: seat,
        [field]: value
      }
    }));
  };

  return (
    <div>
      <h2>Bus Booking</h2>

      <SeatLayout
        seats={seats}
        selected={selectedSeats}
        onToggle={toggleSeat}
      />

      {selectedSeats.map(seat => (
        <PassengerForm
          key={seat}
          seat={seat}
          data={passengers[seat] || ({} as BusBookingSeat)}
          onChange={updatePassenger}
        />
      ))}

      <BusBookingSummary
        totalFare={selectedSeats.length * 500}
        onConfirm={() => {}}
      />
    </div>
  );
}
