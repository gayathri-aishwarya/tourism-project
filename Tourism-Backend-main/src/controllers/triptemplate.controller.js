const TripTemplate = require('../models/triptemplate');
const Bus = require('../models/bus');

// Add Trip Template
const addTripTemplate = async (req, res, next) => {
  try {
    const {
      vehicle_no,
      from_location,
      to_location,
      departure_time,
      arrival_time,
      duration,
      ticket_price,
      schedule_type,
      schedule_meta,
      is_active
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!vehicle_no) missingFields.push('vehicle_no');
    if (!from_location) missingFields.push('from_location');
    if (!to_location) missingFields.push('to_location');
    if (!departure_time) missingFields.push('departure_time');
    if (!arrival_time) missingFields.push('arrival_time');
    if (!ticket_price) missingFields.push('ticket_price');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate ticket_price is a positive number
    if (ticket_price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket price must be greater than 0' 
      });
    }

    // Find bus by vehicle_no
    const bus = await Bus.findOne({ vehicle_no });
    if (!bus) {
      return res.status(404).json({ 
        success: false, 
        message: `Bus with vehicle number ${vehicle_no} not found` 
      });
    }

    // Calculate duration if not provided
    let calculatedDuration = duration;
    if (!calculatedDuration && departure_time && arrival_time) {
      const dep = new Date(`1970-01-01T${departure_time}`);
      const arr = new Date(`1970-01-01T${arrival_time}`);
      calculatedDuration = (arr - dep) / (1000 * 60); // minutes
      if (calculatedDuration < 0) calculatedDuration += 24 * 60; // handle overnight
    }

    const tripTemplate = await TripTemplate.create({
      bus_id: bus._id,
      from_location,
      to_location,
      departure_time,
      arrival_time,
      duration: calculatedDuration,
      ticket_price: Number(ticket_price),
      schedule_type: schedule_type || 'never',
      schedule_meta: schedule_meta || null,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Trip Template created successfully',
      tripTemplate
    });
  } catch (error) {
    console.error('Error in addTripTemplate:', error);
    next(error);
  }
};

// Get All Trip Templates
const getTripTemplates = async (req, res, next) => {
  try {
    const templates = await TripTemplate.find()
      .populate('bus_id')
      .populate('created_by', 'name email');

    res.status(200).json({ 
      success: true, 
      templates: templates || [] 
    });
  } catch (error) {
    console.error('Error in getTripTemplates:', error);
    next(error);
  }
};

// Get Single Trip Template
const getTripTemplate = async (req, res, next) => {
  try {
    const template = await TripTemplate.findById(req.params.id)
      .populate('bus_id')
      .populate('created_by', 'name email');

    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip Template not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      template 
    });
  } catch (error) {
    console.error('Error in getTripTemplate:', error);
    next(error);
  }
};

// Update Trip Template
const updateTripTemplate = async (req, res, next) => {
  try {
    const template = await TripTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip Template not found' 
      });
    }

    const {
      vehicle_no,
      from_location,
      to_location,
      departure_time,
      arrival_time,
      duration,
      ticket_price,
      schedule_type,
      schedule_meta,
      is_active
    } = req.body;

    // Validate ticket_price if provided
    if (ticket_price !== undefined) {
      if (ticket_price <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ticket price must be greater than 0' 
        });
      }
      template.ticket_price = Number(ticket_price);
    }

    // Update bus if vehicle_no changed
    if (vehicle_no) {
      const bus = await Bus.findOne({ vehicle_no });
      if (!bus) {
        return res.status(404).json({ 
          success: false, 
          message: `Bus with vehicle number ${vehicle_no} not found` 
        });
      }
      template.bus_id = bus._id;
    }

    // Update other fields
    if (from_location) template.from_location = from_location;
    if (to_location) template.to_location = to_location;
    if (departure_time) template.departure_time = departure_time;
    if (arrival_time) template.arrival_time = arrival_time;
    if (duration) template.duration = duration;
    if (schedule_type) template.schedule_type = schedule_type;
    if (schedule_meta !== undefined) template.schedule_meta = schedule_meta;
    if (is_active !== undefined) template.is_active = is_active;

    await template.save();

    res.status(200).json({
      success: true,
      message: 'Trip Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error in updateTripTemplate:', error);
    next(error);
  }
};

// Delete Trip Template
const deleteTripTemplate = async (req, res, next) => {
  try {
    const template = await TripTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip Template not found' 
      });
    }

    // Check if there are any trip instances using this template
    const TripInstance = require('../models/tripinstance');
    const hasInstances = await TripInstance.findOne({ trip_template_id: template._id });
    
    if (hasInstances) {
      // Instead of deleting, just deactivate
      template.is_active = false;
      await template.save();
      return res.status(200).json({ 
        success: true, 
        message: 'Trip Template deactivated instead of deleted because it has instances' 
      });
    }

    await template.deleteOne();
    res.status(200).json({ 
      success: true, 
      message: 'Trip Template deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteTripTemplate:', error);
    next(error);
  }
};

module.exports = {
  addTripTemplate,
  getTripTemplates,
  getTripTemplate,
  updateTripTemplate,
  deleteTripTemplate
};