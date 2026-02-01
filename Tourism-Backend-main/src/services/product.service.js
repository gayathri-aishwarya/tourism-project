// src/services/product.service.js
const mongoose = require('mongoose');
const Product = require('../models/product');

/** * Create a new product document*/
async function createProduct(data) {
  const required = ['type', 'name', 'description', 'location_id', 'details'];
  for (const f of required) {
    if (!data[f]) throw new Error(`${f} is required`);
  }
  const created = await Product.create(data);
  return created;
}

/** * Get active products with optional filters and pagination*/
async function getProducts(filters = {}, options = {}) {
  const query = { is_active: true };
  
  if (filters.type) query.type = filters.type;
  if (filters.location_id) query.location_id = filters.location_id;
  if (filters.search) {
    const re = new RegExp(filters.search, 'i');
    query.$or = [{ name: re }, { description: re }];
  }
  
  const page = Math.max(1, parseInt(options.page || 1, 10));
  const limit = parseInt(options.limit || 100, 10); // Default to 100
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('location_id', 'name heroImage')
      .lean(),
    Product.countDocuments(query)
  ]);
  
  return { items, total, page, limit };
}

/** * Get a single product by id */
async function getProductById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid product id');
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');
  return product;
}

/** * Update product (returns updated document)*/
async function updateProduct(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid product id');
  // Prevent altering protected fields
  delete data.createdAt;
  delete data.updatedAt;
  const updated = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new Error('Product not found');
  return updated;
}

/** * Delete product (soft delete by default)* options.hard === true => hard delete*/
async function deleteProduct(id, options = { hard: true }) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid product id');

  if (options.hard) {
    const removed = await Product.findByIdAndDelete(id);
    if (!removed) throw new Error('Product not found');
    return removed;
  }
  const soft = await Product.findByIdAndUpdate(id, { is_active: false }, { new: true });
  if (!soft) throw new Error('Product not found');
  return soft;
}

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };