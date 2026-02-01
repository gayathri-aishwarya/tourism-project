// src/controllers/booking.controller.js
const bookingService = require('../services/booking.service')

/*
 * Create booking
 */
async function createBooking(req, res) {
    try {
        console.log('--- New Booking Request ---')
        console.log('Headers:', req.headers)
        console.log('Raw Body:', req.body)

        let { user_id, branch_id, items, bundle_id } = req.body
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items)
            } catch (e) {
                return res.status(400).json({ message: 'Invalid items JSON' })
            }
        }

        const booking = await bookingService.createBooking({
            user_id,
            branch_id,
            items,
            bundle_id,
        })

        return res.status(201).json(booking)
    } catch (err) {
        if (
            err.message.includes('not found') ||
            err.message.includes('no longer active') ||
            err.message.includes('Insufficient')
        ) {
            return res.status(404).json({ message: err.message })
        }
        if (
            err.message.includes('required') ||
            err.message.includes('Invalid')
        ) {
            return res.status(400).json({ message: err.message })
        }
        console.error('Error creating booking:', err)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/* Customer: get bookings for logged-in user */
async function getMyBookings(req, res) {
    try {
        const { id: userId } = req.params  // From /my-bookings/:id
        console.log('🔍 getMyBookings called for userId:', userId)
        
        const bookings = await bookingService.getBookingsByUser(userId)
        console.log('✅ Found bookings:', bookings.length)
        
        res.json({ bookings })
    } catch (error) {
        console.error('❌ getMyBookings error:', error)
        res.status(500).json({ error: error.message })
    }
}



/* Employee: get bookings for a branch */
async function getBookingsByBranch(req, res) {
    try {
        const isEmployee = req.headers['x-employee'] === 'true'
        if (!isEmployee) {
            return res.status(403).json({ message: 'Employee access required' })
        }

        const branchId = req.params.branchId
        const bookings = await bookingService.getBookingsByBranch(branchId)
        return res.json(bookings)
    } catch (err) {
        if (err.message.includes('Invalid')) {
            return res.status(400).json({ message: err.message })
        }
        return res
            .status(500)
            .json({ message: 'Failed to fetch branch bookings' })
    }
}

/* Employee/Customer: get single booking details (backoffice) */
async function getBookingById(req, res) {
    try {
        const id = req.params.id
        const booking = await bookingService.getBookingById(id)
        const isEmployee = req.headers['x-employee'] === 'true'

        if (isEmployee) {
            return res.json(booking)
        }

        // For customers, require user_id in query and match booking.user_id
        const userId = req.query.user_id
        if (!userId) {
            return res
                .status(403)
                .json({ message: 'Provide user_id query to access booking' })
        }
        if (String(booking.user_id) !== String(userId)) {
            return res
                .status(403)
                .json({ message: 'Access denied to this booking' })
        }
        return res.json(booking)
    } catch (err) {
        if (err.message.includes('Invalid')) {
            return res.status(400).json({ message: err.message })
        }
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message })
        }
        return res.status(500).json({ message: err.message })
    }
}

/* Customer: get single own booking by id (profile edit page) */
async function getMyBookingById(req, res) {
    try {
        const bookingId = req.params.id
        const userId = req.user._id

        const booking = await bookingService.getBookingById(bookingId)
        if (!booking || String(booking.user_id) !== String(userId)) {
            return res.status(404).json({ message: 'Booking not found' })
        }

        return res.json(booking)
    } catch (err) {
        if (err.message.includes('Invalid')) {
            return res.status(400).json({ message: err.message })
        }
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message })
        }
        return res.status(500).json({ message: 'Failed to fetch booking' })
    }
}

/* Customer: update own pending booking (dates/quantity only) */
async function updateMyBooking(req, res) {
    try {
        const bookingId = req.params.id
        const userId = req.user._id
        const { start_date, end_date, nights, quantity } = req.body

        const updated = await bookingService.updateMyBooking(
            bookingId,
            userId,
            {
                start_date,
                end_date,
                nights,
                quantity,
            }
        )

        if (!updated) {
            return res.status(404).json({ message: 'Booking not found' })
        }

        return res.json(updated)
    } catch (err) {
        console.error('Error updating booking by customer:', err.message)
        if (err.message.includes('pending')) {
            return res.status(400).json({ message: err.message })
        }
        if (err.message.includes('Invalid')) {
            return res.status(400).json({ message: err.message })
        }
        return res.status(500).json({ message: 'Failed to update booking' })
    }
}

/* Customer: delete own pending booking */
async function deleteMyBooking(req, res) {
    try {
        const bookingId = req.params.id
        const userId = req.user._id

        const deleted = await bookingService.deleteBookingIfOwnerPending(
            bookingId,
            userId
        )

        if (!deleted) {
            return res
                .status(404)
                .json({ message: 'Booking not found or not deletable' })
        }

        return res.status(204).send()
    } catch (err) {
        console.error('Error deleting booking by customer:', err.message)
        return res.status(400).json({ message: err.message })
    }
}

/* Employee: update booking status */
async function updateBookingStatus(req, res) {
    try {
        const { id } = req.params
        const { status } = req.body

        const userId = req.user._id
        const role = req.user.role

        if (role !== 'employee' && role !== 'master_admin') {
            return res
                .status(403)
                .json({ success: false, message: 'Not authorized' })
        }

        const updated = await bookingService.updateBookingStatus(
            id,
            status,
            userId
        )
        return res.status(200).json(updated)
    } catch (err) {
        console.error('Error updating booking status:', err.message)
        return res.status(400).json({ success: false, message: err.message })
    }
}

/* Employee: update payment status */
async function updatePaymentStatus(req, res) {
    try {
        const { id } = req.params
        const { paymentStatus } = req.body

        const userId = req.user._id
        const role = req.user.role

        if (role !== 'employee' && role !== 'master_admin') {
            return res
                .status(403)
                .json({ success: false, message: 'Not authorized' })
        }

        const updated = await bookingService.updatePaymentStatus(
            id,
            paymentStatus,
            userId
        )
        return res.status(200).json(updated)
    } catch (err) {
        console.error('Error updating payment status:', err.message)
        return res.status(400).json({ success: false, message: err.message })
    }
}

async function getAllBookings(req, res) {
    try {
        const bookings = await bookingService.getAllBookings()
        return res.status(200).json({ bookings })
    } catch (err) {
        console.error('Error fetching bookings:', err.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: err.message,
        })
    }
}

module.exports = {
    createBooking,
    getMyBookings,
    getMyBookingById,
    updateMyBooking,
    deleteMyBooking,
    getBookingsByBranch,
    getBookingById,
    updateBookingStatus,
    updatePaymentStatus,
    getAllBookings,
}
