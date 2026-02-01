// src/services/bundle.service.js
const mongoose = require('mongoose');

const Bundle = require('../models/bundle');

async function createBundle(data) {
  const required = ['name', 'description', 'location_id', 'product_ids', 'price'];
  for (const f of required) {
    if (!data[f]) throw new Error(`${f} is required`);
  }
  return await Bundle.create(data);
}

async function getBundles(filters = {}) {
  const query = {};
  if (filters.location_id) query.location_id = filters.location_id;
  return await Bundle.find(query).populate('product_ids').lean();
}

async function getBundleById(id) {
  return await Bundle.findById(id).populate('product_ids');
}

/** * Update Bundle (returns updated document)*/
async function updateBundle(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid Bundle id');
  // Prevent altering protected fields
  delete data.createdAt;
  delete data.updatedAt;
  const updated = await Bundle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new Error('Bundle not found');
  return updated;
}
/*** Delete bundle (soft delete by default) * options.hard === true => hard delete */
async function deleteBundle(id, options = { hard: true }) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid bundle id');

  if (options.hard) {
    // Hard delete: Remove the bundle permanently
    const removed = await Bundle.findByIdAndDelete(id);
    if (!removed) throw new Error('Bundle not found');
    return removed;
  }

  // Soft delete: Set 'is_active' to false
  const soft = await Bundle.findByIdAndUpdate(id, { is_active: false }, { new: true });
  if (!soft) throw new Error('Bundle not found');
  return soft;
}


module.exports = { createBundle, getBundles, getBundleById,updateBundle,deleteBundle };
