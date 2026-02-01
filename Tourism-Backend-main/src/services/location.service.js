const Location = require("../models/location");
const ApiError = require("../utils/apiError");

const createLocation = async (locationData) => {
  return await Location.create(locationData);
};

const getLocations = async () => {
  return await Location.find();
};

const getLocationById = async (id) => {
  const location = await Location.findById(id);
  if (!location) {
    throw new ApiError(404, "Location not found");
  }
  return location;
};

const updateLocation = async (id, updateData) => {
  const location = await getLocationById(id);
  Object.assign(location, updateData);
  return await location.save();
};

const deleteLocation = async (id) => {
  const location = await getLocationById(id);
  await location.deleteOne();
};

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
