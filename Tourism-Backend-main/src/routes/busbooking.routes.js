// src/routes/busbooking.js
const express = require('express');
const router = express.Router();
const {
  createBusBooking,
  getUserBusBookings,
  getBusBookingDetails,
  cancelBusBooking
} = require('../controllers/busbooking.controller'); // ✅ FIXED: Correct path

const { protect } = require('../middlewares/auth.middleware');

// Create booking
router.post('/', protect, createBusBooking);

// Get all bookings of the logged-in user
router.get('/my-bookings', protect, getUserBusBookings); // Changed to /my-bookings to avoid conflict

// Get booking details
router.get('/:id', protect, getBusBookingDetails);

// Cancel booking
router.delete('/:id/cancel', protect, cancelBusBooking);

// Get bookings by trip instance (for admin)
router.get('/', protect, async (req, res) => {
  try {
    const { trip_instance_id } = req.query;
    const Booking = require('../models/busbooking'); // Import inside the route
    
    let query = {};
    if (trip_instance_id) {
      query.trip_instance_id = trip_instance_id;
    }
    
    const bookings = await Booking.find(query)
      .populate('user_id', 'name email phone')
      .populate('seats');
    
    res.json({ 
      success: true, 
      bookings 
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;