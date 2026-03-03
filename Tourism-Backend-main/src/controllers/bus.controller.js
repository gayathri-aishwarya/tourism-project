const Bus = require('../models/bus');
const ApiError = require('../utils/apiError'); // if you're using it elsewhere

const addBus = async (req, res, next) => {
  try {
    const { vehicle_no, bus_name, bus_type, total_seats, seat_layout } = req.body;

    // Basic validation
    if (!vehicle_no || !bus_type || !total_seats) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Attempt to create the bus
    const bus = await Bus.create({
      vehicle_no,    // keep the same field
      bus_name,
      bus_type,
      total_seats,
      seat_layout
    });

    res.status(201).json({ message: "Bus added successfully", bus });
  } catch (error) {
    // Duplicate vehicle number error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Bus with this vehicle number already exists" });
    }
    next(error);
  }
};
const getBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find();
    res.status(200).json({ success: true, buses });
  } catch (error) {
    next(error);
  }
};

// Get Bus by vehicle number
const getBus = async (req, res, next) => {
  try {
    const bus = await Bus.findOne({ vehicle_no: req.params.vehicle_no });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    res.status(200).json({ success: true, bus });
  } catch (error) {
    next(error);
  }
};

// Update Bus by vehicle number
const updateBus = async (req, res, next) => {
  try {
    const bus = await Bus.findOne({ vehicle_no: req.params.vehicle_no });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    const { bus_name, bus_type, total_seats, seat_layout } = req.body;
    if (bus_name) bus.bus_name = bus_name;
    if (bus_type) bus.bus_type = bus_type;
    if (total_seats) bus.total_seats = total_seats;
    if (seat_layout) bus.seat_layout = seat_layout;

    await bus.save();
    res.status(200).json({ success: true, message: "Bus updated successfully", bus });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Bus with this vehicle number already exists" });
    }
    next(error);
  }
};

// Delete Bus by vehicle number
const deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findOne({ vehicle_no: req.params.vehicle_no });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    await bus.deleteOne();
    res.status(200).json({ success: true, message: "Bus deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Add this function to bus.controller.js
const getBusByIdPublic = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ 
        success: false, 
        message: "Bus not found" 
      });
    }
    res.status(200).json({ 
      success: true, 
      bus 
    });
  } catch (error) {
    next(error);
  }
};

// Make sure it's included in the exports at the bottom
module.exports = {
  addBus,
  getBuses,
  getBus,
  updateBus,
  deleteBus,
  getBusByIdPublic  
};
