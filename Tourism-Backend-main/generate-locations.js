const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Create locations directory
const locationsDir = path.join(__dirname, 'public/assets/images/locations')
if (!fs.existsSync(locationsDir)) {
    fs.mkdirSync(locationsDir, { recursive: true })
}

// ✅ FIXED: Use your first hotel image as base
const sourceImage = path.join(__dirname, 'public/assets/images/hotels/hotel-001.jpeg')

const citySlugs = [
    'sharm-el-sheikh', 'hurghada', 'marsa-alam', 'ain-sokhna', 'sahl-hasheesh',
    'makadi-bay', 'soma-bay', 'el-gouna', 'taba', 'nuweiba',
    'north-coast', 'new-alamein', 'marsa-matrouh', 'dahab', 'cairo',
    'port-said', 'fayoum', 'alexandria', 'ismailia', 'ras-el-bar', 'siwa'
]

console.log('🌆 GENERATING 21 LOCATION HERO IMAGES\n')

let completed = 0
citySlugs.forEach(async (slug) => {
    const targetPath = path.join(locationsDir, `${slug}.jpeg`)
    
    await sharp(sourceImage)
        .resize(1200, 600, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toFile(targetPath)
        .catch(err => console.error(`❌ Error ${slug}:`, err.message))
    
    completed++
    console.log(`✅ ${slug}.jpeg (${completed}/21)`)
})
