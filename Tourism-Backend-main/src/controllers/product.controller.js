// src/controllers/product.controller.js
const productService = require('../services/product.service')
require('dotenv').config()

/* Admin-only create product (temporary admin check via header x-admin: 'true') */
async function createProduct(req, res) {
    try {
        const productData = req.body

        if (productData.details && typeof productData.details === "string") {
            try {
                productData.details = JSON.parse(productData.details)
            } catch (err) {
                return res.status(400).json({ message: "Invalid details format" })
            }
        }

        if (req.file) {
            if (!productData.details || typeof productData.details !== "object") {
                productData.details = {}
            }
            productData.details.img = `${process.env.BACKEND_URL}/uploads/products/${req.file.filename}`
        }

        const product = await productService.createProduct(productData)
        return res.status(201).json(product)
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

/* Public: list active products with filters & pagination */
async function getProducts(req, res) {
    try {
        const filters = {
            type: req.query.type,
            location_id: req.query.location_id,
            search: req.query.search,
        }
        const options = { page: req.query.page, limit: req.query.limit }
        const result = await productService.getProducts(filters, options)
        return res.json(result)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

/* Public: get a single product by id */
async function getProductById(req, res) {
    try {
        const product = await productService.getProductById(req.params.id)
        return res.json(product)
    } catch (err) {
        if (err.message === 'Invalid product id')
            return res.status(400).json({ message: err.message })
        if (err.message === 'Product not found')
            return res.status(404).json({ message: err.message })
        return res.status(500).json({ message: err.message })
    }
}

/* Admin: update a product */
async function updateProduct(req, res) {
    try {
        const updateData = req.body

        if (updateData.details && typeof updateData.details === "string") {
            try {
                updateData.details = JSON.parse(updateData.details)
            } catch (err) {
                return res.status(400).json({ message: "Invalid details format" })
            }
        }

        const existing = await productService.getProductById(req.params.id)

        let mergedDetails = { ...(existing.details || {}) }
        if (updateData.details && typeof updateData.details === "object") {
            mergedDetails = { ...mergedDetails, ...updateData.details }
        }

        if (req.file) {
            mergedDetails.img = `${process.env.BACKEND_URL}/uploads/products/${req.file.filename}`
        }

        const finalUpdateData = {
            ...updateData,
            details: mergedDetails,
        }

        const updated = await productService.updateProduct(req.params.id, finalUpdateData)
        return res.json(updated)
    } catch (err) {
        if (err.message === 'Invalid product id')
            return res.status(400).json({ message: err.message })
        if (err.message === 'Product not found')
            return res.status(404).json({ message: err.message })
        if (err.name === 'ValidationError')
            return res.status(400).json({ message: err.message })
        return res.status(500).json({ message: err.message })
    }
}

/* Admin: delete product (soft) */
async function deleteProduct(req, res) {
    try {
        const result = await productService.deleteProduct(req.params.id, {
            hard: true,
        })
        return res.json({ message: 'Product deleted', product: result })
    } catch (err) {
        if (err.message === 'Invalid product id')
            return res.status(400).json({ message: err.message })
        if (err.message === 'Product not found')
            return res.status(404).json({ message: err.message })
        return res.status(500).json({ message: err.message })
    }
}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
}
