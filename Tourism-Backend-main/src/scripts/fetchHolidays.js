// scripts/fetchHolidays.js
const axios = require('axios')
const Holiday = require('../models/holiday')
const dotenv = require('dotenv')

dotenv.config()

async function fetchAndSaveHolidays() {
    try {
        const year = new Date().getFullYear()

        // check if we already have this year's holidays
        const exists = await Holiday.findOne({
            date: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
            },
        })

        if (exists) {
            console.log(
                `⚠️ Holidays for ${year} already exist, skipping API call`
            )
            return
        }

        const url = `https://calendarific.com/api/v2/holidays?api_key=${process.env.CALENDARIFIC_API_KEY}&country=EG&year=${year}`
        const { data } = await axios.get(url)

        const holidays = data.response.holidays.map((h) => ({
            name: h.name,
            description: h.description,
            date: new Date(h.date.iso),
            type: h.type,
        }))

        await Holiday.deleteMany({})
        await Holiday.insertMany(holidays)
        console.log(`✅ Holidays for ${year} saved to DB`)
    } catch (err) {
        console.error('❌ Error fetching holidays:', err.message)
        throw err
    }
}

module.exports = { fetchAndSaveHolidays }
