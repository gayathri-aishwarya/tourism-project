const mongoose = require('mongoose')
const Product = require('./src/models/product') // <- correct path

const MONGO_URI = 'mongodb://127.0.0.1:27017/tourism_db'
const BASE_URL = 'http://localhost:3000/assets/images/hotels'

async function run() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const hotels = await Product.find({ type: 'hotel' }).sort({ _id: 1 })
  console.log(`Found ${hotels.length} hotels`)

  let updated = 0

  for (let i = 0; i < hotels.length; i++) {
    const hotel = hotels[i]
    const filename = `hotel-${String(i + 1).padStart(3, '0')}.jpeg` // use .jpeg
    const imgUrl = `${BASE_URL}/${filename}`

    await Product.updateOne(
      { _id: hotel._id },
      {
        $set: {
          'details.img': imgUrl,
          images: [imgUrl],
        },
      }
    )

    updated++
    console.log(`✅ ${hotel.name} → ${filename}`)
  }

  console.log(`Done. Updated ${updated} hotels.`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
