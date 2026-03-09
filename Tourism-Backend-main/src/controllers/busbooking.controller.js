const BusBooking = require('../models/busbooking');
const BusBookingSeat = require('../models/busbookingseat');
const TripInstance = require('../models/tripinstance');
const TripTemplate = require('../models/triptemplate');
const mongoose = require('mongoose');

// --- Create BusBooking (WITHOUT transactions - works with standalone MongoDB)
const createBusBooking = async (req, res, next) => {
  // REMOVED: session and transaction code
  try {
    const { trip_instance_id, seats, phone } = req.body;

    // 1️⃣ Basic validation
    if (!trip_instance_id || !seats || seats.length === 0 || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields (trip_instance_id, seats, or phone)'
      });
    }

    // 2️⃣ Egyptian phone validation
    const egyptPhoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!egyptPhoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be a valid Egyptian mobile number (11 digits)'
      });
    }

    // 3️⃣ Validate age exists for each seat
    for (const s of seats) {
      if (s.age === undefined || s.age === null) {
        return res.status(400).json({
          success: false,
          message: 'Each seat must include the passenger age'
        });
      }
      if (s.age < 0 || s.age > 120) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 0 and 120'
        });
      }
    }

    // 4️⃣ Prevent children under 10 traveling alone
    const adultsCount = seats.filter(s => s.age >= 10).length;
    const childrenCount = seats.filter(s => s.age < 10).length;
    
    if (adultsCount === 0 && childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Children under 10 must be accompanied by at least one adult'
      });
    }

    // 5️⃣ Get TripInstance (NO session)
    const instance = await TripInstance.findById(trip_instance_id);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'TripInstance not found' });
    }
    
    if (instance.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Trip is not active' });
    }

    // Check if travel date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const travelDate = new Date(instance.travel_date);
    travelDate.setHours(0, 0, 0, 0);
    
    if (travelDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot book past trips' });
    }

    // 6️⃣ Validate seat numbers exist and are available
    const requestedSeats = seats.map(s => s.seat_number);
    const invalidSeats = requestedSeats.filter(s => !instance.all_seats.includes(s));
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid seat numbers: ${invalidSeats.join(', ')}`
      });
    }

    const alreadyBooked = requestedSeats.filter(s => instance.booked_seats.includes(s));
    if (alreadyBooked.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seats already booked: ${alreadyBooked.join(', ')}`
      });
    }

    // 7️⃣ Check available seats count
    if (instance.available_seats < seats.length) {
      return res.status(400).json({
        success: false,
        message: `Only ${instance.available_seats} seats available`
      });
    }

    // 8️⃣ Fetch TripTemplate price
    const tripTemplate = await TripTemplate.findById(instance.trip_template_id);
    if (!tripTemplate) {
      return res.status(404).json({ success: false, message: 'TripTemplate not found' });
    }

    const adultPrice = tripTemplate.ticket_price;
    const childPrice = adultPrice / 2; // Half price for under 5 only

    // 9️⃣ Calculate total fare
    let totalFare = 0;
    seats.forEach(s => {
      totalFare += s.age < 5 ? childPrice : adultPrice;
    });

    // 🔟 Create main booking (NO session array)
    const booking = await BusBooking.create({
      user_id: req.user.id,
      trip_instance_id,
      phone,
      total_fare: totalFare,
      payment_status: 'pending',  // ✅ ADDED: Track payment status
      booking_status: 'pending'    // ✅ CHANGED: from 'confirmed' to 'pending'
    });

    // 1️⃣1️⃣ Create individual booking seats with price_paid
    const bookingSeats = seats.map(s => ({
      busbooking_id: booking._id,
      seat_number: s.seat_number,
      passenger_name: s.passenger_name,
      age: s.age,
      price_paid: s.age < 5 ? childPrice : adultPrice
    }));
    
    await BusBookingSeat.insertMany(bookingSeats);

    // 1️⃣2️⃣ Update TripInstance
    instance.booked_seats.push(...requestedSeats);
    instance.available_seats -= seats.length;
    await instance.save();

    // Populate the booking with seats for response
    const populatedBooking = await BusBooking.findById(booking._id)
      .populate('seats')
      .populate({
        path: 'trip_instance_id',
        populate: {
          path: 'trip_template_id',
          populate: { path: 'bus_id' }
        }
      });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });

  } catch (error) {
    next(error);
  }
};

// Get all bookings of logged-in user
const getUserBusBookings = async (req, res, next) => {
  try {
    const bookings = await BusBooking.find({ user_id: req.user.id })
      .populate({
        path: 'trip_instance_id',
        populate: {
          path: 'trip_template_id',
          populate: { path: 'bus_id' }
        }
      })
      .populate('seats')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: bookings.length,
      bookings 
    });
  } catch (error) {
    next(error);
  }
};

// Get single booking details
const getBusBookingDetails = async (req, res, next) => {
  try {
    const booking = await BusBooking.findById(req.params.id)
      .populate({
        path: 'trip_instance_id',
        populate: {
          path: 'trip_template_id',
          populate: { path: 'bus_id' }
        }
      })
      .populate('seats');

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user_id.toString() !== req.user.id && 
        !['master_admin', 'employee'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this booking' 
      });
    }

    res.status(200).json({ 
      success: true, 
      booking 
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking (WITHOUT transactions)
const cancelBusBooking = async (req, res, next) => {
  // REMOVED: session and transaction code
  try {
    const booking = await BusBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user_id.toString() !== req.user.id && 
        !['master_admin', 'employee'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to cancel this booking' 
      });
    }

    // Check if booking can be cancelled (not completed, not already cancelled)
    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking is already cancelled' 
      });
    }

    if (booking.booking_status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Completed bookings cannot be cancelled' 
      });
    }
    
    // Check if payment is already refunded
    if (booking.payment_status === 'refunded') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking already refunded' 
      });
    }

    // Get trip instance and check if travel date is in the future
    const instance = await TripInstance.findById(booking.trip_instance_id);
    if (!instance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip instance not found' 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const travelDate = new Date(instance.travel_date);
    travelDate.setHours(0, 0, 0, 0);
    
    if (travelDate < today) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel past or ongoing trips' 
      });
    }

    // Get booked seats
    const bookedSeats = await BusBookingSeat.find({ 
      busbooking_id: booking._id 
    });
    
    const seatNumbers = bookedSeats.map(s => s.seat_number);

    // Update trip instance - remove booked seats
    instance.booked_seats = instance.booked_seats.filter(
      seat => !seatNumbers.includes(seat)
    );
    instance.available_seats += bookedSeats.length;
    await instance.save();

    // Delete booking seats
    await BusBookingSeat.deleteMany({ 
      busbooking_id: booking._id 
    });

    // Update booking status to cancelled
    booking.booking_status = 'cancelled';
    booking.payment_status = 'refunded';  // ✅ Track refund status
    await booking.save();

    res.status(200).json({ 
      success: true, 
      message: 'Booking cancelled successfully' 
    });

  } catch (error) {
    next(error);
  }
};

// ✅ EXPORT ALL FUNCTIONS
module.exports = { 
  createBusBooking, 
  getUserBusBookings, 
  getBusBookingDetails,
  cancelBusBooking
};