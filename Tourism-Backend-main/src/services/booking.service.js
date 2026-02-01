// src/services/booking.service.js
const mongoose = require('mongoose')
const Booking = require('../models/booking')
const Product = require('../models/product')
const BookingProduct = require('../models/booking_product')
const Bundle = require('../models/bundle')

const VALID_STATUSES = new Set(['pending', 'confirmed', 'paid', 'cancelled'])

// ---------- Utilities ----------

function ensureObjectId(id, name = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${name}`)
  }
  return new mongoose.Types.ObjectId(id)
}

// Returns integer number of nights between two ISO/Date values (>=1)
function countNights(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start) || isNaN(end)) throw new Error('Invalid start/end date')
  const ms = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)
  const nights = Math.ceil(ms / (1000 * 60 * 60 * 24))
  if (nights < 1) throw new Error('Stay must be at least 1 night')
  return nights
}

// Simple markup utility
function applyMarkup(amount, markupPercent = 0) {
  if (!markupPercent) return amount
  const m = Number(markupPercent)
  if (isNaN(m)) return amount
  return Math.round(amount * (1 + m / 100) * 100) / 100
}

// ---------- Bus seats helpers ----------

const seatsObjectToString = (layout) => {
  return layout.rows
    .map((row) => {
      const sideToString = (side) =>
        side
          ? side
              .map((seat) => `${seat.number}:${seat.isBooked ? 1 : 0}`)
              .join(',')
          : ''

      const parts = [
        sideToString(row.left),
        sideToString(row.middle),
        sideToString(row.right),
      ].filter(Boolean)
      return parts.join(';')
    })
    .join(' | ')
}

const seatsStringToObject = (str) => {
  if (!str) return { rows: [] }

  const rows = str.split('|').map((rowStr) => {
    const sides = rowStr.trim().split(';')

    const parseSeats = (side) =>
      side
        ? side.split(',').map((s) => {
            const [num, booked] = s.split(':')
            return {
              number: parseInt(num),
              isBooked: booked === '1',
            }
          })
        : []

    return {
      left: parseSeats(sides[0]),
      middle: sides.length === 3 ? parseSeats(sides[1]) : undefined,
      right: parseSeats(sides[sides.length - 1]),
    }
  })

  return { rows }
}

// ---------- Per-type validators & calculators ----------

function validateAndPriceBus(product, item) {
  const requestedSeatNumbers = item?.details?.seat_numbers
  if (!Array.isArray(requestedSeatNumbers) || requestedSeatNumbers.length === 0) {
    throw new Error('Bus: details.seat_numbers array is required.')
  }

  const busSeatsString = product?.details?.bus_seats
  if (!busSeatsString) {
    throw new Error('Bus: Product is missing bus_seats details.')
  }

  const busLayout = seatsStringToObject(busSeatsString)

  const allSeatsInLayout = busLayout.rows.flatMap((row) => [
    ...(row.left || []),
    ...(row.middle || []),
    ...(row.right || []),
  ])

  const alreadyBooked = []
  const seatsToUpdate = []

  for (const requestedNum of requestedSeatNumbers) {
    const seat = allSeatsInLayout.find((s) => s.number === requestedNum)
    if (!seat) {
      throw new Error(`Bus: Seat number ${requestedNum} does not exist.`)
    }
    if (seat.isBooked) {
      alreadyBooked.push(requestedNum)
    } else {
      seatsToUpdate.push(seat)
    }
  }

  if (alreadyBooked.length > 0) {
    throw new Error(
      `Bus: The following seats are already booked: ${alreadyBooked.join(', ')}`
    )
  }

  seatsToUpdate.forEach((seat) => {
    seat.isBooked = true
  })

  const updatedBusSeatsString = seatsObjectToString(busLayout)

  const seatsToBookCount = requestedSeatNumbers.length
  const pricePerSeat = Number(product?.details?.price_per_seat)
  if (!pricePerSeat || pricePerSeat < 0) {
    throw new Error('Bus: product missing price_per_seat')
  }

  const filter = { _id: product._id }
  const update = {
    $set: { 'details.bus_seats': updatedBusSeatsString },
    $inc: { 'details.booked_seats': seatsToBookCount },
  }

  const lineTotal = seatsToBookCount * pricePerSeat

  return {
    quantity: seatsToBookCount,
    unitPrice: pricePerSeat,
    lineTotal,
    snapshotDetails: {
      seats_booked: seatsToBookCount,
      seat_numbers: requestedSeatNumbers,
      price_per_seat: pricePerSeat,
    },
    availabilityUpdate: { filter, update },
  }
}

function validateAndPriceActivity(product, item) {
  const persons = Number(
    item?.details?.persons || item?.details?.number_of_persons
  )
  if (!persons || persons < 1)
    throw new Error('Activity: details.persons must be a positive number')

  const pricePerPerson = Number(product?.details?.price_per_person)
  if (!pricePerPerson || pricePerPerson < 0)
    throw new Error('Activity: product missing price_per_person')

  const hasAvailable = typeof product?.details?.available_spots === 'number'
  const hasMaxSize = typeof product?.details?.max_size === 'number'
  let filter, update

  if (hasAvailable) {
    filter = {
      _id: product._id,
      'details.available_spots': { $gte: persons },
    }
    update = { $inc: { 'details.available_spots': -persons } }
  } else if (hasMaxSize) {
    filter = {
      _id: product._id,
      $expr: {
        $gte: [
          {
            $subtract: [
              '$details.max_size',
              { $ifNull: ['$details.booked_count', 0] },
            ],
          },
          persons,
        ],
      },
    }
    update = { $inc: { 'details.booked_count': persons } }
  } else {
    throw new Error(
      'Activity: product missing availability fields (available_spots or max_size)'
    )
  }

  const lineTotal = persons * pricePerPerson

  return {
    quantity: persons,
    unitPrice: pricePerPerson,
    lineTotal,
    snapshotDetails: {
      persons_booked: persons,
      price_per_person: pricePerPerson,
    },
    availabilityUpdate: { filter, update },
  }
}

function validateAndPriceHotel(product, item, { markupPercent = 0 } = {}) {
  const roomType = item?.details?.room_type
  const requestedQty = Number(item?.details?.quantity || 1)
  const startDate = item?.details?.start_date
  const endDate = item?.details?.end_date

  if (!roomType) throw new Error('Hotel: details.room_type is required')
  if (!requestedQty || requestedQty < 1) {
    throw new Error('Hotel: details.quantity must be a positive number')
  }
  if (!startDate || !endDate) {
    throw new Error('Hotel: details.start_date/end_date required')
  }

  if (
    !product.details ||
    !Array.isArray(product.details.room_types) ||
    !product.details.available_rooms ||
    typeof product.details.prices_per_night !== 'object' ||
    product.details.prices_per_night === null
  ) {
    throw new Error(
      `Hotel: Product ${product._id} has a missing or invalid data structure.`
    )
  }

  if (!product.details.room_types.includes(roomType)) {
    throw new Error(
      `Hotel: room_type "${roomType}" not found in product details`
    )
  }

  const roomTypeKey = roomType.toLowerCase()
  const availableCount = product.details.available_rooms[roomTypeKey]

  if (typeof availableCount !== 'number') {
    throw new Error(
      `Hotel: Availability for room type "${roomType}" is not configured correctly.`
    )
  }

  if (availableCount < requestedQty) {
    throw new Error(
      `Hotel: Not enough rooms of type "${roomType}" available. Only ${availableCount} left.`
    )
  }

  const pricePerNight = Number(product.details.prices_per_night[roomTypeKey])
  if (isNaN(pricePerNight) || pricePerNight < 0) {
    throw new Error(
      `Hotel: product missing or has invalid price for room type "${roomType}".`
    )
  }

  const nights = countNights(startDate, endDate)

  const filter = {
    _id: product._id,
    [`details.available_rooms.${roomTypeKey}`]: { $gte: requestedQty },
  }
  const update = {
    $inc: { [`details.available_rooms.${roomTypeKey}`]: -requestedQty },
  }

  let unitPrice = pricePerNight
  // unitPrice = applyMarkup(unitPrice, markupPercent);

  const lineTotal = nights * unitPrice * requestedQty

  return {
    quantity: requestedQty,
    unitPrice,
    lineTotal,
    snapshotDetails: {
      room_type: roomType,
      quantity: requestedQty,
      nights,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      price_per_night: unitPrice,
    },
    availabilityUpdate: { filter, update },
  }
}

function validateAndPriceFlight(product, item) {
  const tickets = Number(item?.details?.tickets_booked)
  if (!tickets || tickets < 1) {
    throw new Error(
      'Flight: details.tickets_booked must be a positive number'
    )
  }

  const requestedDepartureTime = item?.details?.departure_time
  if (!requestedDepartureTime) {
    throw new Error(
      'Flight: details.departure_time is required in the request.'
    )
  }

  const productDepartureTime = product?.details?.departure_time
  if (!productDepartureTime) {
    throw new Error(
      'Flight: Product is missing departure_time in its details.'
    )
  }

  const requestedDate = new Date(requestedDepartureTime)
  const productDate = new Date(productDepartureTime)

  if (isNaN(requestedDate.getTime())) {
    throw new Error('Flight: Invalid departure_time format in request.')
  }

  if (requestedDate.getTime() >= productDate.getTime()) {
    throw new Error(
      'Flight: The requested departure time does not match the scheduled flight time.'
    )
  }

  const pricePerTicket = Number(product?.details?.price_per_ticket)
  if (!pricePerTicket || pricePerTicket < 0) {
    throw new Error('Flight: product missing price_per_ticket')
  }

  const availableTickets = product?.details?.available_tickets
  if (typeof availableTickets !== 'number') {
    throw new Error('Flight: product missing details.available_tickets')
  }

  if (availableTickets < tickets) {
    throw new Error(
      `Flight: Not enough tickets available. Only ${availableTickets} left.`
    )
  }

  const filter = {
    _id: product._id,
    'details.available_tickets': { $gte: tickets },
  }
  const update = {
    $inc: { 'details.available_tickets': -tickets },
  }

  const lineTotal = tickets * pricePerTicket

  return {
    quantity: tickets,
    unitPrice: pricePerTicket,
    lineTotal,
    snapshotDetails: {
      tickets_booked: tickets,
      price_per_ticket: pricePerTicket,
      departure_date: productDate,
    },
    availabilityUpdate: { filter, update },
  }
}

// ---------- snapshot & availability ----------

async function buildSnapshotAndTotal(items, { hotelMarkupPercent = 0 } = {}) {
  if (!Array.isArray(items) || !items.length)
    throw new Error('items array must not be empty')

  const snapshot = []
  const availabilityOps = []
  let total = 0

  for (const it of items) {
    if (!it.product_id) throw new Error('Each item must include product_id')

    const prodId = ensureObjectId(it.product_id, 'product_id')
    const product = await Product.findById(prodId).lean()
    if (!product) throw new Error(`Product ${it.product_id} not found`)
    if (product.is_active === false)
      throw new Error(`Product ${it.product_id} is no longer active`)

    let res
    switch (product.type) {
      case 'bus':
        res = validateAndPriceBus(product, it)
        break
      case 'activity':
        res = validateAndPriceActivity(product, it)
        break
      case 'hotel':
        res = validateAndPriceHotel(product, it, {
          markupPercent: hotelMarkupPercent,
        })
        break
      case 'flight':
        res = validateAndPriceFlight(product, it)
        break
      default:
        throw new Error(`Unsupported product type: ${product.type}`)
    }

    total += res.lineTotal

    snapshot.push({
      product_id: prodId,
      name: product.name,
      type: product.type,
      quantity: res.quantity,
      unit_price: res.unitPrice,
      total_amount: res.lineTotal,
      details: res.snapshotDetails,
    })

    availabilityOps.push(res.availabilityUpdate)
  }

  return { snapshot, total, availabilityOps }
}

async function applyAvailabilityUpdates(ops) {
  for (const op of ops) {
    const options = { new: true }
    if (op.arrayFilters) {
      options.arrayFilters = op.arrayFilters
    }
    const result = await Product.findOneAndUpdate(op.filter, op.update, options)
    if (!result) {
      throw new Error('Insufficient availability for one or more items')
    }
  }
}

// ---------- Public API -----------

async function calculateTotalPrice(items) {
  const { total } = await buildSnapshotAndTotal(items)
  return total
}

/* Create booking in DB (stores snapshot in items) */
async function createBooking(data) {
  const body = data.body || data
  const { user_id, branch_id, items, bundle_id } = body

  if (!user_id) throw new Error('user_id is required')
  if (!branch_id) throw new Error('branch_id is required')

  const userId = ensureObjectId(user_id, 'user_id')
  const branchId = ensureObjectId(branch_id, 'branch_id')

  let snapshot
  let total
  let availabilityOps = []

  if (bundle_id) {
    const bundle = await Bundle.findById(bundle_id)
      .populate('product_ids')
      .lean()
    if (!bundle) {
      throw new Error(`Bundle with id ${bundle_id} not found`)
    }
    if (!bundle.is_active) {
      throw new Error(`Bundle ${bundle.name} is no longer active`)
    }

    total = bundle.price

    snapshot = bundle.product_ids.map((product) => ({
      product_id: product._id,
      name: product.name,
      type: product.type,
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
      details: {
        ...product.details,
        booked_as_bundle: true,
        bundle_name: bundle.name,
      },
    }))
    // currently no availability updates for bundles
  } else if (items && items.length > 0) {
    const hotelMarkupPercent = Number(process.env.HOTEL_MARKUP_PERCENT || 0)
    const processedCart = await buildSnapshotAndTotal(items, {
      hotelMarkupPercent,
    })
    snapshot = processedCart.snapshot
    total = processedCart.total
    availabilityOps = processedCart.availabilityOps
  } else {
    throw new Error(
      "Booking must contain either an 'items' array or a 'bundle_id'"
    )
  }

  if (availabilityOps.length > 0) {
    await applyAvailabilityUpdates(availabilityOps)
  }

  let bookingItemsForPayment

  if (bundle_id) {
    const bundle = await Bundle.findById(bundle_id).lean()
    bookingItemsForPayment = [
      {
        name: bundle.name,
        description: 'Pre-defined package',
        quantity: 1,
        amount: total,
      },
    ]
  } else {
    bookingItemsForPayment = snapshot.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      description: item.name,
      quantity: item.quantity,
      amount: item.total_amount,
      details: item.details,
    }))
  }

  const createdBooking = await Booking.create({
    user_id: userId,
    branch_id: branchId,
    status: 'pending',
    paymentStatus: 'pending',
    history: [{ employee_id: null, action: 'Booking created' }],
    total_price: total,
    items: bookingItemsForPayment,
    bundle_info: bundle_id ? { bundle_id: bundle_id } : null,
  })

  const bookingProducts = snapshot.map((item) => ({
    ...item,
    booking_id: createdBooking._id,
  }))

  await BookingProduct.insertMany(bookingProducts)

  return createdBooking
}

/* Get bookings for a user */
// async function getBookingsByUser(userId) {
//   const uid = ensureObjectId(userId, 'user id')
//   return await Booking.find({ user_id: uid })
//     .sort({ createdAt: -1 })
//     .lean()
// }


async function getBookingsByUser(userId) {
  const uid = ensureObjectId(userId, 'user id')
  
  // Step 1: Get bookings with FULL BookingProduct items
  const bookings = await Booking.find({ user_id: uid })  // ← FIXED field!
    .populate({
      path: 'items',  // ← Populate BookingProduct items
      model: 'BookingProduct',
      populate: {
        path: 'product_id',  // ← Nested populate to Product
        model: 'Product',
        select: 'name type image images details location'
      }
    })
    .sort({ createdAt: -1 })
    .lean()
  
  return bookings
}


/* Get bookings for a branch (employee) */
async function getBookingsByBranch(branchId) {
  const bid = ensureObjectId(branchId, 'branch id')
  return await Booking.find({ branch_id: bid }).sort({ createdAt: -1 }).lean()
}

/* Get single booking by id (with BookingProduct items) */
async function getBookingById(id) {
  const _id = ensureObjectId(id, 'booking id')
  const booking = await Booking.findById(_id).lean()
  if (!booking) throw new Error('Booking not found')

  const items = await BookingProduct.find({ booking_id: _id }).lean()
  booking.items = items
  return booking
}

/* Customer: update own pending booking */
async function updateMyBooking(bookingId, userId, updates) {
  const _id = ensureObjectId(bookingId, 'booking id')
  const uid = ensureObjectId(userId, 'user id')

  const booking = await Booking.findOne({ _id, user_id: uid })
  if (!booking) return null

  if (booking.status !== 'pending') {
    throw new Error('Only pending bookings can be edited')
  }

  const item = booking.items[0]
  const { start_date, end_date, nights, quantity } = updates

  if (start_date) item.details.start_date = new Date(start_date)
  if (end_date) item.details.end_date = new Date(end_date)
  if (nights) item.details.nights = Number(nights)
  if (quantity) {
    item.details.quantity = Number(quantity)
    item.quantity = Number(quantity)
  }

  item.amount =
    item.details.price_per_night *
    item.details.nights *
    item.details.quantity

  booking.total_price = item.amount

  booking.history.push({
    employee_id: null,
    action: 'Booking updated by customer',
    timestamp: new Date(),
  })

  const updated = await booking.save()
  return updated.toObject()
}

/* Delete booking if owner and still pending (for customer self-service) */
async function deleteBookingIfOwnerPending(bookingId, userId) {
  const _id = ensureObjectId(bookingId, 'booking id')
  const uid = ensureObjectId(userId, 'user id')

  const deleted = await Booking.findOneAndDelete({
    _id,
    user_id: uid,
    status: 'pending',
  }).lean()

  return deleted
}

// update booking status
async function updateBookingStatus(id, newStatus, employeeId = null) {
  const _id = ensureObjectId(id, 'booking id')

  if (!VALID_STATUSES.has(newStatus)) {
    throw new Error('Invalid booking statuts')
  }

  const historyEntry = {
    timestamp: new Date(),
    employee_id: employeeId
      ? ensureObjectId(employeeId, 'employee id')
      : null,
    action: `Booking status changed to '${newStatus}'.`,
  }

  const updated = await Booking.findByIdAndUpdate(
    _id,
    {
      $set: { status: newStatus },
      $push: { history: historyEntry },
    },
    { new: true }
  ).lean()

  if (!updated) throw new Error('Booking not found')
  return updated
}

// update payment status
async function updatePaymentStatus(id, newPaymentStatus, employeeId = null) {
  const _id = ensureObjectId(id, 'booking id')

  const VALID_PAYMENT_STATUSES = new Set(['pending', 'paid', 'failed'])
  if (!VALID_PAYMENT_STATUSES.has(newPaymentStatus)) {
    throw new Error('Invalid payment status')
  }

  const historyEntry = {
    timestamp: new Date(),
    employee_id: employeeId
      ? ensureObjectId(employeeId, 'employee id')
      : null,
    action: `Payment status changed to '${newPaymentStatus}'.`,
  }

  const updated = await Booking.findByIdAndUpdate(
    _id,
    {
      $set: { paymentStatus: newPaymentStatus },
      $push: { history: historyEntry },
    },
    { new: true }
  ).lean()

  if (!updated) throw new Error('Booking not found')
  return updated
}

async function getAllBookings() {
  const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean()
  return bookings
}

module.exports = {
  calculateTotalPrice,
  createBooking,
  getBookingsByUser,
  getBookingsByBranch,
  getBookingById,
  updateMyBooking,
  deleteBookingIfOwnerPending,
  updateBookingStatus,
  updatePaymentStatus,
  getAllBookings,
}
