// Tourism-Frontend-main/app/buses/select-seat/[tripInstanceId]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FaBus, FaClock, FaMapMarkerAlt, FaCalendarAlt, 
  FaChair, FaUser, FaRestroom, FaBan,
  FaArrowLeft, FaShoppingCart, FaCheck, FaCrown, FaStar,
  FaUserCircle, FaPhone, FaEnvelope, FaCreditCard,
  FaCouch, FaBed, FaExclamationTriangle
} from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import { UserContext } from '@/src/contexts/Contexts';
import { useContext } from 'react';
import styles from './page.module.css';

// Types
interface Seat {
  id: string;
  number: string;
  type: 'regular' | 'blocked' | 'driver' | 'wc';
  position: { row: number; col: number; side: 'left' | 'right' };
  status: 'available' | 'booked' | 'selected';
  price: number;
}

interface TripInstance {
  _id: string;
  trip_template_id: {
    from_location: string;
    to_location: string;
    departure_time: string;
    arrival_time: string;
    duration: number;
    ticket_price: number;
    bus_id: {
      _id: string;
      vehicle_no: string;
      bus_type: string;
      total_seats: number;
      seat_layout: any;
    };
  };
  travel_date: string;
  booked_seats: string[];
  available_seats: number;
  status: string;
}

interface Passenger {
  seatNumber: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  price: number; // Store the price for this passenger
}

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useContext(UserContext);
  
  const [tripInstanceId, setTripInstanceId] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripInstance | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'seats' | 'details' | 'payment'>('seats');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Passenger details state
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
  });

  useEffect(() => {
    if (params && params.tripInstanceId) {
      setTripInstanceId(params.tripInstanceId as string);
    }
  }, [params]);

  useEffect(() => {
    if (tripInstanceId) {
      loadTripData();
    }
  }, [tripInstanceId]);

  useEffect(() => {
    if (tripInstanceId && !isLoggedIn()) {
      router.push(`/login?redirect=/buses/select-seat/${tripInstanceId}`);
    }
  }, [isLoggedIn, router, tripInstanceId]);

  // Update passengers when selected seats change
  useEffect(() => {
    setPassengers(selectedSeats.map(seat => ({
      seatNumber: seat.number,
      name: '',
      age: 0,
      gender: 'male',
      price: seat.price
    })));
  }, [selectedSeats]);

const loadTripData = async () => {
  if (!tripInstanceId) return;
  
  try {
    setLoading(true);
    setError(null);

    // Get trip instance details (this is already public via /:id)
    const response = await adminBusApi.getTripInstance(tripInstanceId);
    const tripData = response.instance;
    setTrip(tripData);

    // Get bus layout using PUBLIC endpoint (no auth required)
    const busId = tripData.trip_template_id.bus_id._id;
    const busResponse = await adminBusApi.getBusPublic(busId); // Changed to getBusPublic
    const busData = busResponse.bus;

    const parsedSeats = parseSeatLayout(busData, tripData.booked_seats || [], tripData.trip_template_id.ticket_price);
    setSeats(parsedSeats);

  } catch (err: any) {
    console.error('Error loading trip:', err);
    setError(err.message || 'Failed to load trip details');
  } finally {
    setLoading(false);
  }
};

  const parseSeatLayout = (busData: any, bookedSeats: string[], basePrice: number): Seat[] => {
    const seats: Seat[] = [];
    
    if (busData.seat_layout && Array.isArray(busData.seat_layout)) {
      busData.seat_layout.forEach((row: string[], rowIndex: number) => {
        row.forEach((seatData: string, colIndex: number) => {
          if (!seatData) return;

          let seatNumber: string;
          let seatType: 'regular' | 'blocked' | 'driver' | 'wc' = 'regular';
          
          if (seatData.includes(':')) {
            const [num, type] = seatData.split(':');
            seatNumber = num;
            seatType = type as any;
          } else {
            seatNumber = seatData;
          }

          const side = colIndex < 2 ? 'left' : 'right';
          const isBooked = bookedSeats.includes(seatNumber);

          // Price based on seat type
          let price = 0;
          if (seatType === 'regular') {
            price = basePrice;
          }

          seats.push({
            id: `seat-${seatNumber}`,
            number: seatNumber,
            type: seatType,
            position: { row: rowIndex, col: colIndex, side },
            status: isBooked ? 'booked' : 'available',
            price: price
          });
        });
      });
    }

    return seats;
  };

  const handleSeatClick = (seat: Seat) => {
    if (bookingStep !== 'seats') return;
    if (seat.type !== 'regular' || seat.status === 'booked') return;

    if (seat.status === 'available') {
      const updatedSeats = seats.map(s => 
        s.id === seat.id ? { ...s, status: 'selected' as const } : s
      );
      setSeats(updatedSeats);
      setSelectedSeats([...selectedSeats, { ...seat, status: 'selected' }]);
    } else if (seat.status === 'selected') {
      const updatedSeats = seats.map(s => 
        s.id === seat.id ? { ...s, status: 'available' as const } : s
      );
      setSeats(updatedSeats);
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    }
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string | number) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
    
    // Clear validation error when user makes changes
    setValidationError(null);
  };

  const handleContactChange = (field: 'email' | 'phone', value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const validatePassengerDetails = (): boolean => {
    // Check if all passengers have names
    for (const p of passengers) {
      if (!p.name.trim()) {
        setValidationError('Please enter name for all passengers');
        return false;
      }
      if (p.age <= 0 || p.age > 120) {
        setValidationError('Please enter valid age for all passengers (1-120)');
        return false;
      }
    }

    // Check adult supervision rule (children under 10 need adult)
    const adultsCount = passengers.filter(p => p.age >= 10).length;
    const childrenCount = passengers.filter(p => p.age < 10).length;
    
    if (adultsCount === 0 && childrenCount > 0) {
      setValidationError('Children under 10 must be accompanied by at least one adult (age 10+)');
      return false;
    }

    // Check contact info
    if (!contactInfo.email) {
      setValidationError('Email is required');
      return false;
    }
    if (!contactInfo.phone) {
      setValidationError('Phone number is required');
      return false;
    }

    // Egyptian phone validation
    const egyptPhoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!egyptPhoneRegex.test(contactInfo.phone)) {
      setValidationError('Please enter a valid Egyptian mobile number (11 digits starting with 010, 011, 012, or 015)');
      return false;
    }

    return true;
  };

  const handleProceedToDetails = () => {
    if (selectedSeats.length > 0) {
      setBookingStep('details');
    }
  };

  const handleProceedToPayment = () => {
    if (validatePassengerDetails()) {
      setBookingStep('payment');
    }
  };

  

  const handleBooking = async () => {
    try {
      setValidationError(null);
      
      // Final validation before booking
      if (!validatePassengerDetails()) {
        return;
      }

      // Calculate final total with age-based pricing
      const basePrice = trip?.trip_template_id.ticket_price || 0;
      const adultPrice = basePrice;
      const childPrice = adultPrice / 2; // Half price for under 5

      // Recalculate total fare based on ages (backend will do this too, but we show it)
      const calculatedTotal = passengers.reduce((sum, p) => {
        return sum + (p.age < 5 ? childPrice : adultPrice);
      }, 0);

      // Create booking payload matching backend expectations
      const bookingData = {
        trip_instance_id: tripInstanceId,
        seats: passengers.map(p => ({
          seat_number: p.seatNumber,
          passenger_name: p.name,
          age: p.age,
          gender: p.gender
        })),
        phone: contactInfo.phone,
        total_fare: calculatedTotal
      };

      console.log('Booking data:', bookingData);
      
      // Call your booking API
      // const response = await adminBusApi.createBooking(bookingData);
      
      // Redirect to success page with booking ID
      // router.push(`/booking-success/${response.booking._id}`);
      
      // For now, just show success
      alert('Booking successful! (Demo mode)');
      
    } catch (error: any) {
      console.error('Booking failed:', error);
      setValidationError(error.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  const getSeatIcon = (seat: Seat) => {
    if (seat.type === 'driver') return <FaUser className={styles.seatIcon} />;
    if (seat.type === 'wc') return <FaRestroom className={styles.seatIcon} />;
    if (seat.type === 'regular') {
      return <FaCouch className={styles.seatIcon} />;
    }
    return null;
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.type === 'driver') return '#8b5cf6';
    if (seat.type === 'wc') return '#6b7280';
    if (seat.type === 'blocked') return 'transparent';
    
    switch (seat.status) {
      case 'booked': return '#ef4444';
      case 'selected': return '#f97316';
      default: return '#10b981';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate total with age-based pricing
  const calculateTotal = () => {
    if (!trip) return 0;
    const basePrice = trip.trip_template_id.ticket_price;
    const adultPrice = basePrice;
    const childPrice = adultPrice / 2;
    
    return passengers.reduce((sum, p) => {
      return sum + (p.age < 5 ? childPrice : adultPrice);
    }, 0);
  };

  const totalPrice = calculateTotal();

  if (!tripInstanceId) {
    return (
      <div className={styles.errorContainer}>
        <h2>Invalid Trip</h2>
        <p>Trip instance ID is missing</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading seat layout...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className={styles.errorContainer}>
        <h2>Unable to Load Trip</h2>
        <p>{error || 'Trip not found'}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const template = trip.trip_template_id;
  const bus = template.bus_id;
  const basePrice = template.ticket_price;

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.position.row;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  // Sort seats within each row by column
  Object.keys(seatsByRow).forEach(rowKey => {
    seatsByRow[parseInt(rowKey)].sort((a, b) => a.position.col - b.position.col);
  });

  const maxRows = Math.max(...Object.keys(seatsByRow).map(Number), 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <FaArrowLeft /> Back to Search
        </button>
        
        <div className={styles.tripSummary}>
          <div className={styles.route}>
            <FaMapMarkerAlt className={styles.routeIcon} />
            <span>{template.from_location}</span>
            <span className={styles.routeArrow}>→</span>
            <span>{template.to_location}</span>
          </div>
          <div className={styles.tripDetails}>
            <span><FaCalendarAlt /> {formatDate(trip.travel_date)}</span>
            <span><FaClock /> {formatTime(template.departure_time)}</span>
            <span><FaBus /> {bus.vehicle_no}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column - Seat Layout */}
        <div className={styles.seatLayoutSection}>
          <h2>Choose Your Seat</h2>
          
          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <FaCouch className={styles.legendIcon} style={{ color: '#10b981' }} />
              <span>Available</span>
            </div>
            <div className={styles.legendItem}>
              <FaChair className={styles.legendIcon} style={{ color: '#ef4444' }} />
              <span>Booked</span>
            </div>
            <div className={styles.legendItem}>
              <FaCouch className={styles.legendIcon} style={{ color: '#f97316' }} />
              <span>Selected</span>
            </div>
            <div className={styles.legendItem}>
              <FaUser className={styles.legendIcon} style={{ color: '#8b5cf6' }} />
              <span>Driver</span>
            </div>
            <div className={styles.legendItem}>
              <FaRestroom className={styles.legendIcon} style={{ color: '#6b7280' }} />
              <span>WC</span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className={styles.pricingInfo}>
            <div className={styles.priceBadge}>
              <span>Adult (10+):</span>
              <strong>EGP {basePrice}</strong>
            </div>
            <div className={styles.priceBadge}>
              <span>Child (under 5):</span>
              <strong>EGP {basePrice / 2}</strong>
            </div>
            <div className={styles.priceNote}>
              <FaExclamationTriangle /> Children under 10 must be accompanied by an adult
            </div>
          </div>

          {/* Bus Layout */}
          <div className={styles.busLayout}>
            <div className={styles.busFront}>
              <FaUser className={styles.driverIcon} /> Driver
            </div>

            <div className={styles.seatsContainer}>
              {Array.from({ length: maxRows + 1 }).map((_, rowIdx) => {
                const rowSeats = seatsByRow[rowIdx] || [];
                if (rowSeats.length === 0) return null;
                
                // Split seats into left and right
                const leftSeats = rowSeats.filter(s => s.position.col < 2);
                const rightSeats = rowSeats.filter(s => s.position.col >= 2);
                
                return (
                  <div key={`row-${rowIdx}`} className={styles.seatRow}>
                    <div className={styles.rowLabel}>{String.fromCharCode(65 + rowIdx)}</div>
                    
                    {/* Left side seats */}
                    <div className={styles.leftSide}>
                      {leftSeats.map(seat => (
                        seat.type !== 'blocked' && (
                          <button
                            key={seat.id}
                            className={`${styles.seat} ${styles[seat.type]} ${styles[seat.status]}`}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'booked' || seat.type !== 'regular' || bookingStep !== 'seats'}
                            style={{ backgroundColor: getSeatColor(seat) }}
                            title={`Seat ${seat.number}`}
                          >
                            {getSeatIcon(seat)}
                            <span className={styles.seatNumber}>{seat.number}</span>
                          </button>
                        )
                      ))}
                    </div>

                    {/* Aisle */}
                    <div className={styles.aisle}>
                      <span></span>
                    </div>

                    {/* Right side seats */}
                    <div className={styles.rightSide}>
                      {rightSeats.map(seat => (
                        seat.type !== 'blocked' && (
                          <button
                            key={seat.id}
                            className={`${styles.seat} ${styles[seat.type]} ${styles[seat.status]}`}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'booked' || seat.type !== 'regular' || bookingStep !== 'seats'}
                            style={{ backgroundColor: getSeatColor(seat) }}
                            title={`Seat ${seat.number}`}
                          >
                            {getSeatIcon(seat)}
                            <span className={styles.seatNumber}>{seat.number}</span>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.busRear}>Rear</div>
          </div>
        </div>

        {/* Right Column - Booking Flow */}
        <div className={styles.bookingFlow}>
          {bookingStep === 'seats' && (
            <div className={styles.selectionCard}>
              <h3>Your Selection</h3>
              
              {selectedSeats.length > 0 ? (
                <>
                  <div className={styles.selectedSeatsList}>
                    {selectedSeats.map(seat => (
                      <div key={seat.id} className={styles.selectedSeatRow}>
                        <div className={styles.seatInfo}>
                          <FaCouch style={{ color: '#f97316' }} />
                          <span>Seat {seat.number}</span>
                        </div>
                        <span className={styles.seatPrice}>EGP {seat.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalPrice}>
                    <span>Total Price</span>
                    <span className={styles.priceAmount}>EGP {selectedSeats.reduce((sum, s) => sum + s.price, 0)}</span>
                  </div>

                  <button 
                    className={styles.proceedBtn}
                    onClick={handleProceedToDetails}
                  >
                    Continue to Passenger Details
                  </button>
                </>
              ) : (
                <div className={styles.noSelection}>
                  <FaShoppingCart className={styles.cartIcon} />
                  <p>No seats selected</p>
                  <p className={styles.hint}>Click on available seats to select them</p>
                </div>
              )}
            </div>
          )}

          {bookingStep === 'details' && (
            <div className={styles.detailsCard}>
              <h3>Passenger Details</h3>
              
              {validationError && (
                <div className={styles.validationError}>
                  <FaExclamationTriangle /> {validationError}
                </div>
              )}
              
              {passengers.map((passenger, index) => {
                // Calculate price for this passenger based on age
                const passengerPrice = passenger.age < 5 ? basePrice / 2 : basePrice;
                
                return (
                  <div key={index} className={styles.passengerForm}>
                    <h4>
                      Passenger {index + 1} - Seat {passenger.seatNumber}
                      <span className={styles.passengerPrice}>EGP {passengerPrice}</span>
                    </h4>
                    
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                        placeholder="Enter passenger name"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Age</label>
                        <input
                          type="number"
                          value={passenger.age || ''}
                          onChange={(e) => handlePassengerChange(index, 'age', parseInt(e.target.value) || 0)}
                          placeholder="Age"
                          min="1"
                          max="120"
                        />
                        {passenger.age < 5 && (
                          <small className={styles.ageDiscount}>50% discount applied</small>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>Gender</label>
                        <select
                          value={passenger.gender}
                          onChange={(e) => handlePassengerChange(index, 'gender', e.target.value as any)}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className={styles.contactSection}>
                <h4>Contact Information</h4>
                
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone (Egyptian)</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    placeholder="01234567890"
                  />
                  <small className={styles.phoneHint}>e.g., 01234567890</small>
                </div>
              </div>

              <div className={styles.totalPrice}>
                <span>Total Amount</span>
                <span className={styles.priceAmount}>EGP {totalPrice}</span>
              </div>

              <div className={styles.buttonGroup}>
                <button 
                  className={styles.backBtn}
                  onClick={() => setBookingStep('seats')}
                >
                  Back to Seats
                </button>
                <button 
                  className={styles.proceedBtn}
                  onClick={handleProceedToPayment}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {bookingStep === 'payment' && (
            <div className={styles.paymentCard}>
              <h3>Payment</h3>
              
              {validationError && (
                <div className={styles.validationError}>
                  <FaExclamationTriangle /> {validationError}
                </div>
              )}
              
              <div className={styles.paymentSummary}>
                <h4>Booking Summary</h4>
                {passengers.map((p, i) => {
                  const passengerPrice = p.age < 5 ? basePrice / 2 : basePrice;
                  return (
                    <div key={i} className={styles.summaryRow}>
                      <span>
                        <FaCouch style={{ color: '#f97316', marginRight: '0.25rem' }} /> 
                        Seat {p.seatNumber} - {p.name} {p.age < 5 && <small>(Child)</small>}
                      </span>
                      <span>EGP {passengerPrice}</span>
                    </div>
                  );
                })}
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span>EGP {totalPrice}</span>
                </div>
              </div>

              <div className={styles.paymentMethods}>
                <h4>Payment Method</h4>
                <label className={styles.paymentOption}>
                  <input type="radio" name="payment" defaultChecked />
                  <FaCreditCard /> Credit / Debit Card
                </label>
              </div>

              <div className={styles.buttonGroup}>
                <button 
                  className={styles.backBtn}
                  onClick={() => setBookingStep('details')}
                >
                  Back
                </button>
                <button 
                  className={styles.payBtn}
                  onClick={handleBooking}
                >
                  Pay EGP {totalPrice}
                </button>
              </div>
            </div>
          )}

          {/* Trip Summary Card */}
          <div className={styles.tripCard}>
            <h4>Trip Details</h4>
            <div className={styles.tripDetails}>
              <p><strong>From:</strong> {template.from_location}</p>
              <p><strong>To:</strong> {template.to_location}</p>
              <p><strong>Date:</strong> {formatDate(trip.travel_date)}</p>
              <p><strong>Time:</strong> {formatTime(template.departure_time)}</p>
              <p><strong>Bus:</strong> {bus.vehicle_no}</p>
              <p><strong>Available:</strong> {trip.available_seats} seats</p>
              <p><strong>Base Price:</strong> EGP {basePrice}</p>
              <p><small>Children under 5 get 50% discount</small></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}