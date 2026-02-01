const express = require('express')
// middleware's for protection can be added here
const analyticsController = require('../controllers/analytics.controller')

const router = express.Router()

router.get('/overview', analyticsController.getOverview)

router.get('/top-products', analyticsController.getTopProducts)

module.exports = router