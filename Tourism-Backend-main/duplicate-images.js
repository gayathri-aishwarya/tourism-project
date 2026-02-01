const fs = require('fs')
const path = require('path')

// Create hotels folder if it doesn't exist
const hotelsDir = path.join(__dirname, 'public/assets/images/hotels')
if (!fs.existsSync(hotelsDir)) {
    fs.mkdirSync(hotelsDir, { recursive: true })
    console.log('✅ Created: public/assets/images/hotels/')
}

// Source: your 58 beach photos (wherever they are now)
const sourceDir = path.join(__dirname, 'uploads/products')  // Adjust if different

// Your 58 photos (adjust filenames to match yours)
const sourceImages = [
    '1756393737244.jpg',
    '1756394040381.jpg',
    '1756394935097.jpg',
    // ... add all 58 filenames here
    // Or we'll make it dynamic
]

// Dynamic: Find ALL images in uploads/products
const allSourceImages = fs.readdirSync(sourceDir)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
    .slice(0, 58)  // Take first 58

console.log(`📸 Found ${allSourceImages.length} source images`)
console.log(`🔄 Duplicating to 214 hotel images...`)

let counter = 1
for (let i = 0; i < 214; i++) {
    // Cycle through 58 images (58, 58, 58...)
    const sourceIndex = i % allSourceImages.length
    const sourceFile = allSourceImages[sourceIndex]
    const sourcePath = path.join(sourceDir, sourceFile)
    
    const targetFilename = `hotel-${String(counter).padStart(3, '0')}.jpeg`
    const targetPath = path.join(hotelsDir, targetFilename)
    
    // Copy file
    fs.copyFileSync(sourcePath, targetPath)
    if (counter % 10 === 0 || counter === 1 || counter === 214) {
        console.log(`✅ ${targetFilename} ← ${sourceFile}`)
    }
    
    counter++
}

console.log('\n🎉 DONE! 214 hotel images created!')
console.log(`📁 Location: ${hotelsDir}`)
