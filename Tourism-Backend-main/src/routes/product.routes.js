// src/routes/product.routes.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/product.controller')
const { protect, isMasterAdmin } = require('../middlewares/auth.middleware')
const upload = require('../middlewares/uploads')

router.post('/', protect, upload.single('img'), controller.createProduct) // Admin-only     //done_(body-needed)
router.get('/', controller.getProducts) // Public list    //done
router.get('/:id', controller.getProductById) // Public single  //done
router.put('/:id', protect, upload.single('img'), controller.updateProduct) // Admin update  //done
router.delete('/:id', protect, isMasterAdmin, controller.deleteProduct) // Admin delete  //done

module.exports = router
