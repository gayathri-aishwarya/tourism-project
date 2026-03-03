// server.js
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/assets', express.static(path.join(__dirname, 'public/assets')))
app.use(express.static(path.join(__dirname, 'public')))

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Enable CORS
app.use(
    cors({
        origin: 'http://localhost:3000', // frontend URL
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

// Middlewares
app.use(express.json()) // parse JSON bodies
app.use(morgan('dev'))  // logging

// MongoDB connection
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB error:', err))

// Import routes
const authRoutes = require('./src/routes/auth.routes')
const userRoutes = require('./src/routes/user.routes')
const branchRoutes = require('./src/routes/branch.routes')
const productRoutes = require('./src/routes/product.routes')
const bundleRoutes = require('./src/routes/bundle.routes')
const locationRoutes = require('./src/routes/location.routes')
const paymentRoutes = require('./src/routes/payment.routes')
const holidaysRoutes = require('./src/routes/holidays')
const bookingRoutes = require('./src/routes/booking.routes')
const analyticsRoutes = require('./src/routes/analytics.routes')
const busRoutes = require('./src/routes/admin/bus.routes')
const tripTemplateRoutes = require('./src/routes/admin/triptemplate.routes');
const tripInstanceRoutes = require('./src/routes/tripinstance.routes');
const busBookingRoutes = require('./src/routes/busbooking.routes');
// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/products', productRoutes)
app.use('/api/bundles', bundleRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/holidays', holidaysRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/buses', busRoutes);
app.use('/api/trip-templates', tripTemplateRoutes);
app.use('/api/trip-instances', tripInstanceRoutes);
app.use('/api/bus-bookings', busBookingRoutes);



// 404 handler
app.use((req, res) => {
    console.log(`404 hit for ${req.method} ${req.url}`)
    res.status(404).json({ message: 'Not Found' })
})

  app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})