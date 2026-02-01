const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads' // default

        // Choose folder dynamically
        if (req.baseUrl.includes('locations')) {
            folder = 'uploads/locations'
        } else if (req.baseUrl.includes('products')) {
            folder = 'uploads/products'
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true })
            console.log(`Created upload directory: ${folder}`)
        }

        cb(null, folder)
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname)
        cb(null, uniqueName)
    },
})

const upload = multer({ storage })

module.exports = upload
