/**
 * Generate seat layout based on bus type and total seats
 */
const generateSeatLayout = (busType, totalSeats) => {
  const layout = [];
  const seatsPerRow = busType === 'sleeper' ? 2 : 4; // Sleeper has fewer seats per row
  
  for (let i = 0; i < totalSeats; i += seatsPerRow) {
    const row = [];
    for (let j = 0; j < seatsPerRow; j++) {
      if (i + j < totalSeats) {
        const seatNumber = String.fromCharCode(65 + Math.floor(i / seatsPerRow)) + (j + 1);
        row.push(seatNumber);
      }
    }
    layout.push(row);
  }
  
  return layout;
};

/**
 * Check if seats are contiguous (for group bookings)
 */
const areSeatsContiguous = (selectedSeats, layout) => {
  if (selectedSeats.length <= 1) return true;
  
  // Convert seat numbers to coordinates
  const seats = selectedSeats.map(seat => {
    const match = seat.match(/([A-Z]+)(\d+)/);
    if (!match) return null;
    return {
      row: match[1],
      col: parseInt(match[2])
    };
  }).filter(s => s !== null);
  
  // Check if all seats are in the same row and consecutive
  const firstRow = seats[0].row;
  const sameRow = seats.every(s => s.row === firstRow);
  if (!sameRow) return false;
  
  // Check if columns are consecutive
  const cols = seats.map(s => s.col).sort((a, b) => a - b);
  for (let i = 1; i < cols.length; i++) {
    if (cols[i] !== cols[i-1] + 1) return false;
  }
  
  return true;
};

/**
 * Get seat price based on age and base price
 */
const getSeatPrice = (age, basePrice) => {
  if (age < 5) return basePrice * 0.5; // 50% for infants
  if (age < 18) return basePrice * 0.75; // 25% discount for children
  return basePrice; // Full price for adults
};

/**
 * Validate seat selection against layout
 */
const validateSeatSelection = (selectedSeats, allSeats, bookedSeats) => {
  const invalidSeats = selectedSeats.filter(s => !allSeats.includes(s));
  if (invalidSeats.length > 0) {
    return {
      valid: false,
      message: `Invalid seats: ${invalidSeats.join(', ')}`
    };
  }
  
  const alreadyBooked = selectedSeats.filter(s => bookedSeats.includes(s));
  if (alreadyBooked.length > 0) {
    return {
      valid: false,
      message: `Seats already booked: ${alreadyBooked.join(', ')}`
    };
  }
  
  return { valid: true };
};

module.exports = {
  generateSeatLayout,
  areSeatsContiguous,
  getSeatPrice,
  validateSeatSelection
};