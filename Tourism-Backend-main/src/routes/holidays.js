const express = require('express')
const Holiday = require('../models/holiday')
const { fetchAndSaveHolidays } = require('../scripts/fetchHolidays')

const router = express.Router()

router.get('/upcoming', async (req, res) => {
    try {
        const today = new Date()
        const future = new Date()
        future.setDate(today.getDate() + 60)

        // ensure holidays exist for the current year
        await fetchAndSaveHolidays()

        const upcoming = await Holiday.find({
            date: { $gte: today, $lte: future },
        }).sort({ date: 1 })

        if (upcoming.length === 0) {
            return res
                .status(200)
                .json({ message: 'No upcoming holidays in next 60 days' })
        }

        return res.status(200).json({
            message: 'Upcoming holidays found',
            holidays: upcoming.map((h) => ({
                name: h.name,
                date: h.date.toISOString().split('T')[0],
                description: h.description,
            })),
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router
