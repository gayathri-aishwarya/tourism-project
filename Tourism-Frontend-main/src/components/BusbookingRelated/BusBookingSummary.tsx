// src/components/BusbookingRelated/BusBookingSummary.tsx
interface Props {
  totalFare: number;
  selectedSeats: number;
  onConfirm: () => void;
  loading?: boolean;
}

export default function BusBookingSummary({
  totalFare,
  selectedSeats,
  onConfirm,
  loading = false
}: Props) {
  return (
    <div className="booking-summary">
      <h3>Booking Summary</h3>
      
      <div className="summary-row">
        <span>Selected Seats:</span>
        <span>{selectedSeats}</span>
      </div>
      
      <div className="summary-row total">
        <span>Total Fare:</span>
        <span className="total-amount">EGP {totalFare}</span>
      </div>

      <button
        onClick={onConfirm}
        disabled={selectedSeats === 0 || loading}
        className="confirm-btn"
      >
        {loading ? 'Processing...' : 'Confirm Booking'}
      </button>
    </div>
  );
}