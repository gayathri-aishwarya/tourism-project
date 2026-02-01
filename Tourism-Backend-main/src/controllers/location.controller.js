const locationService = require('../services/location.service')
require('dotenv').config()

const catchAsync = require('../utils/catchAsync')
const { successResponse } = require('../utils/responseHandlers')

const createLocation = catchAsync(async (req, res) => {
    const locationData = req.body

    if (req.file) {
        locationData.heroImage = `${process.env.BACKEND_URL}/uploads/locations/${req.file.filename}`
    }

    const location = await locationService.createLocation(locationData)
    successResponse(res, location, 201)
})

const getLocations = catchAsync(async (req, res) => {
    const locations = await locationService.getLocations()
    successResponse(res, locations)
})

const getLocation = catchAsync(async (req, res) => {
    const location = await locationService.getLocationById(req.params.id)
    successResponse(res, location)
})

const updateLocation = catchAsync(async (req, res) => {
    const updateData = req.body

    if (req.file) {
        updateData.heroImage = `${process.env.BACKEND_URL}/uploads/locations/${req.file.filename}`
    }

    const location = await locationService.updateLocation(
        req.params.id,
        updateData
    )
    successResponse(res, location)
})

const deleteLocation = catchAsync(async (req, res) => {
    await locationService.deleteLocation(req.params.id)
    successResponse(res, null, 204)
})

module.exports = {
    createLocation,
    getLocations,
    getLocation,
    updateLocation,
    deleteLocation,
}
