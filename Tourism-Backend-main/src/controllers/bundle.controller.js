// src/controllers/bundle.controller.js
const bundle = require("../models/bundle");
const bundleService = require("../services/bundle.service");

async function createBundle(req, res) {
  try {
    const bundle = await bundleService.createBundle(req.body);
    return res.status(201).json(bundle);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function getBundles(req, res) {
  try {
    const filters = { location_id: req.query.location_id };
    const bundles = await bundleService.getBundles(filters);
    return res.json(bundles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getBundleById(req, res) {
  try {
    const bundle = await bundleService.getBundleById(req.params.id);
    if (!bundle) return res.status(404).json({ message: "Bundle not found" });
    return res.json(bundle);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
async function updateBundle(req, res) {
  try {
    const updated = await bundleService.updateBundle(req.params.id, req.body);
    return res.json(updated);
  } catch (err) {
    if (err.message === "Invalid bundle id")
      return res.status(400).json({ message: err.message });
    if (err.message === "Bundle not found")
      return res.status(404).json({ message: err.message });
    if (err.name === "ValidationError")
      return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
}

async function deleteBundle(req, res) {
  try {
    // Admin check (headers.x-admin === 'true')
    /*
    // Check if the ID is valid
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bundle id' });
    }

    // Determine if it's a hard or soft delete based on query param
    const hardDelete = req.query.hard === 'true';
*/
    // Call the bundle service to delete the bundle
    //    const result = await bundleService.deleteBundle(id, { hard: hardDelete });
    const result = await bundleService.deleteBundle(req.params.id, {
      hard: true,
    });
    return res.json({ message: "Bundle deleted", bundle: result });
  } catch (err) {
    //    return res.json({  message: hardDelete ? 'Bundle permanently deleted' : 'Bundle soft deleted', bundle: result,});
    //  } catch (err) {}
    if (err.message === "Invalid bundle id")
      return res.status(400).json({ message: err.message });
    if (err.message === "Product not found")
      return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
  //  {
  //Handle various error cases
  //   if (err.message === 'Bundle not found') {
  //      return res.status(404).json({ message: err.message });
  //    }
  //  return res.status(500).json({ message: err.message });
  //}
}

module.exports = {
  createBundle,
  getBundles,
  getBundleById,
  updateBundle,
  deleteBundle,
};
