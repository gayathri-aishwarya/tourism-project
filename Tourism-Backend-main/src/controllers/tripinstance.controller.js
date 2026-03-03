const TripInstance = require('../models/tripinstance');
const TripTemplate = require('../models/triptemplate');
const Bus = require('../models/bus');

// Create TripInstance (admin only)
const addTripInstance = async (req, res, next) => {
  try {
    const { trip_template_id, travel_date } = req.body;

    if (!trip_template_id || !travel_date) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const template = await TripTemplate.findById(trip_template_id).populate('bus_id');
    if (!template) return res.status(404).json({ success: false, message: 'TripTemplate not found' });

    const bus = template.bus_id;
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });

    // Check if instance already exists for this date
    const existingInstance = await TripInstance.findOne({
      trip_template_id,
      travel_date: new Date(travel_date)
    });

    if (existingInstance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trip instance already exists for this date' 
      });
    }

    // Generate all seat numbers
    let allSeats = [];
    if (bus.seat_layout && bus.seat_layout.length > 0) {
      if (Array.isArray(bus.seat_layout) && Array.isArray(bus.seat_layout[0])) {
        allSeats = bus.seat_layout.flat(); // flatten 2D array to 1D
      } else {
        allSeats = bus.seat_layout; // already 1D
      }
    } else {
      // fallback: sequential numbers "1".."total_seats"
      allSeats = Array.from({ length: bus.total_seats }, (_, i) => (i+1).toString());
    }

    const instance = await TripInstance.create({
      trip_template_id,
      travel_date,
      booked_seats: [],
      available_seats: bus.total_seats,
      all_seats: allSeats,
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'TripInstance created', instance });
  } catch (error) {
    console.error('Error in addTripInstance:', error);
    next(error);
  }
};

// Search available trips (public)
const searchAvailableTrips = async (req, res, next) => {
  try {
    const { from, to, date, bus_type, page = 1, limit = 10 } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide from, to, and date' 
      });
    }

    // Find matching trip templates
    const templates = await TripTemplate.find({
      from_location: { $regex: new RegExp(from, 'i') },
      to_location: { $regex: new RegExp(to, 'i') },
      is_active: true
    }).populate('bus_id');

    if (templates.length === 0) {
      return res.status(200).json({ 
        success: true, 
        trips: [],
        pagination: { total: 0, page: 1, pages: 0 }
      });
    }

    const templateIds = templates.map(t => t._id);

    // Find instances for the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      trip_template_id: { $in: templateIds },
      travel_date: { $gte: startOfDay, $lte: endOfDay },
      status: 'active',
      available_seats: { $gt: 0 }
    };

    // Add bus type filter if provided
    if (bus_type) {
      const busIds = templates
        .filter(t => t.bus_id && t.bus_id.bus_type === bus_type)
        .map(t => t.bus_id._id.toString());
      
      const filteredTemplateIds = templates
        .filter(t => busIds.includes(t.bus_id._id.toString()))
        .map(t => t._id);
      
      query.trip_template_id = { $in: filteredTemplateIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [instances, total] = await Promise.all([
      TripInstance.find(query)
        .populate({
          path: 'trip_template_id',
          populate: { path: 'bus_id' }
        })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ 'trip_template_id.departure_time': 1 }),
      TripInstance.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      trips: instances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in searchAvailableTrips:', error);
    next(error);
  }
};

// Get all TripInstances
const getTripInstances = async (req, res, next) => {
  try {
    const { trip_template_id, status, date } = req.query;
    let filter = {};

    if (trip_template_id) filter.trip_template_id = trip_template_id;
    if (status) filter.status = status;
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.travel_date = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    const instances = await TripInstance.find(filter)
      .populate({
        path: 'trip_template_id',
        populate: { path: 'bus_id' }
      })
      .sort({ travel_date: 1 });

    res.status(200).json({ success: true, instances });
  } catch (error) {
    console.error('Error in getTripInstances:', error);
    next(error);
  }
};

// Get single TripInstance with seat availability details
const getTripInstance = async (req, res, next) => {
  try {
    const instance = await TripInstance.findById(req.params.id)
      .populate({
        path: 'trip_template_id',
        populate: { path: 'bus_id' }
      });

    if (!instance) {
      return res.status(404).json({ success: false, message: 'TripInstance not found' });
    }

    // Get seat layout with availability info
    const bus = instance.trip_template_id?.bus_id;
    let seatsWithAvailability = {};

    if (bus && bus.seat_layout) {
      const seatLayout = bus.seat_layout;
      
      if (Array.isArray(seatLayout)) {
        // Flatten if 2D, use as-is if 1D
        const flatSeats = Array.isArray(seatLayout[0]) ? seatLayout.flat() : seatLayout;
        
        flatSeats.forEach(seatNum => {
          seatsWithAvailability[seatNum] = {
            number: seatNum,
            isBooked: instance.booked_seats.includes(seatNum.toString()),
            isAvailable: instance.available_seats > 0 && 
                        !instance.booked_seats.includes(seatNum.toString())
          };
        });
      }
    }

    const response = instance.toObject();
    response.seats = seatsWithAvailability;

    res.status(200).json({ success: true, instance: response });
  } catch (error) {
    console.error('Error in getTripInstance:', error);
    next(error);
  }
};

// Update TripInstance
const updateTripInstance = async (req, res, next) => {
  try {
    const instance = await TripInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'TripInstance not found' });
    }

    const { travel_date, status } = req.body;
    if (travel_date) instance.travel_date = travel_date;
    if (status) instance.status = status;

    await instance.save();
    res.status(200).json({ success: true, message: 'TripInstance updated', instance });
  } catch (error) {
    console.error('Error in updateTripInstance:', error);
    next(error);
  }
};

// Delete TripInstance
const deleteTripInstance = async (req, res, next) => {
  try {
    const instance = await TripInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'TripInstance not found' });
    }

    // Check if there are any bookings
    const BusBooking = require('../models/busbooking');
    const hasBookings = await BusBooking.exists({ trip_instance_id: instance._id });
    
    if (hasBookings) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete trip instance with existing bookings' 
      });
    }

    await instance.deleteOne();
    res.status(200).json({ success: true, message: 'TripInstance deleted' });
  } catch (error) {
    console.error('Error in deleteTripInstance:', error);
    next(error);
  }
};

// Generate trip instances from templates (for admin)
const generateTripInstances = async (req, res, next) => {
  try {
    const { trip_template_id, start_date, end_date } = req.body;

    // Validate required fields
    if (!trip_template_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trip template ID is required' 
      });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start and end dates are required' 
      });
    }

    // Get the template
    const template = await TripTemplate.findById(trip_template_id).populate('bus_id');
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip template not found' 
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    let created = 0;
    let skipped = 0;

    // Generate instances for each date
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      // Create date range for query
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Check if instance already exists
      const existing = await TripInstance.findOne({
        trip_template_id,
        travel_date: {
          $gte: dayStart,
          $lte: dayEnd
        }
      });

      if (!existing) {
        // Generate seat numbers
        let allSeats = [];
        if (template.bus_id && template.bus_id.seat_layout) {
          const layout = template.bus_id.seat_layout;
          allSeats = Array.isArray(layout[0]) ? layout.flat() : layout;
        } else {
          allSeats = Array.from({ length: template.bus_id.total_seats }, (_, i) => (i+1).toString());
        }

        await TripInstance.create({
          trip_template_id,
          travel_date: date,
          booked_seats: [],
          available_seats: template.bus_id.total_seats,
          all_seats: allSeats,
          status: 'active'
        });
        created++;
      } else {
        skipped++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Instances generated successfully',
      stats: { created, skipped }
    });
  } catch (error) {
    console.error('Error generating instances:', error);
    next(error);
  }
};

// Generate trip instances from templates based on schedule (cron job)
const generateScheduledInstances = async (req, res, next) => {
  try {
    const { daysAhead = 30 } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    // Find active templates with schedules
    const templates = await TripTemplate.find({ 
      is_active: true,
      schedule_type: { $ne: 'never' }
    }).populate('bus_id');

    let created = 0;
    let skipped = 0;

    for (const template of templates) {
      let currentDate = new Date(today);
      
      while (currentDate <= endDate) {
        let shouldCreate = false;

        switch (template.schedule_type) {
          case 'daily':
            shouldCreate = true;
            break;
          case 'weekly':
            const dayOfWeek = currentDate.getDay();
            let scheduledDays = [1,2,3,4,5,6,0]; // default all days
            if (template.schedule_meta) {
              try {
                const meta = JSON.parse(template.schedule_meta);
                scheduledDays = meta.days || scheduledDays;
              } catch {
                // use default
              }
            }
            shouldCreate = scheduledDays.includes(dayOfWeek);
            break;
          case 'monthly':
            const dayOfMonth = currentDate.getDate();
            let scheduledDates = [1,15]; // default 1st and 15th
            if (template.schedule_meta) {
              try {
                const meta = JSON.parse(template.schedule_meta);
                scheduledDates = meta.dates || scheduledDates;
              } catch {
                // use default
              }
            }
            shouldCreate = scheduledDates.includes(dayOfMonth);
            break;
          default:
            shouldCreate = false;
        }

        if (shouldCreate) {
          // Check if instance already exists
          const dayStart = new Date(currentDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(23, 59, 59, 999);

          const existing = await TripInstance.findOne({
            trip_template_id: template._id,
            travel_date: {
              $gte: dayStart,
              $lte: dayEnd
            }
          });

          if (!existing) {
            // Generate all seat numbers
            let allSeats = [];
            if (template.bus_id && template.bus_id.seat_layout) {
              const layout = template.bus_id.seat_layout;
              allSeats = Array.isArray(layout[0]) ? layout.flat() : layout;
            } else {
              allSeats = Array.from({ length: template.bus_id.total_seats }, (_, i) => (i+1).toString());
            }

            await TripInstance.create({
              trip_template_id: template._id,
              travel_date: new Date(currentDate),
              booked_seats: [],
              available_seats: template.bus_id.total_seats,
              all_seats: allSeats,
              status: 'active'
            });
            created++;
          } else {
            skipped++;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled instances generated',
      stats: { created, skipped }
    });
  } catch (error) {
    console.error('Error generating scheduled instances:', error);
    next(error);
  }
};



module.exports = {
  addTripInstance,
  searchAvailableTrips,
  getTripInstances,
  getTripInstance,
  updateTripInstance,
  deleteTripInstance,
  generateTripInstances,
  generateScheduledInstances
};