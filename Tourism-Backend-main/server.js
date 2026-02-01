const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')

const userRoutes = require('./src/routes/user.routes')
const authRoutes = require('./src/routes/auth.routes')
const branchRoutes = require('./src/routes/branch.routes')
const productRoutes = require('./src/routes/product.routes')
const bundleRoutes = require('./src/routes/bundle.routes')
const locationRoutes = require('./src/routes/location.routes')
const paymentRoutes = require('./src/routes/payment.routes')
const holidaysRoutes = require('./src/routes/holidays')


const bookingRoutes = require('./src/routes/booking.routes')
const analyticsRoutes = require('./src/routes/analytics.routes')
//Spinwheel
// const websiteLeadRoutes = require('./src/routes/websiteLead.routes');
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/assets', express.static(path.join(__dirname, 'public/assets')))
app.use(express.static(path.join(__dirname, 'public')))
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Enable CORS for any origin
app.use(
    cors({
        // origin: process.env.FRONTEND_URL,
        //origin: '*',
        origin: 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

app.use(express.json())
app.use(morgan('dev'))

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB error:', err))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/locations', locationRoutes)
//
app.use('/api/products', productRoutes) //done
app.use('/api/bundles', bundleRoutes) //done

app.use('/api/bookings', bookingRoutes) //done
app.use('/api/payments', paymentRoutes)

app.use('/api/holidays', holidaysRoutes)
app.use('/api/analytics', analyticsRoutes)

//app.use('/api/website-leads', websiteLeadRoutes); // Spinwheel leads

app.use((req, res) => {
    console.log(`404 hit for ${req.method} ${req.url}`)
    res.status(404).json({ message: 'Not Found' })
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
