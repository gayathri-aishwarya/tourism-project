const express = require('express')
const router = express.Router()

const { protect, isMasterAdmin } = require('../middlewares/auth.middleware')

const {
    createBranch,
    getAllBranches,
    updateBranch,
    getBranchById,
} = require('../controllers/branch.controller')

router.post('/', protect, isMasterAdmin, createBranch)

router.get('/', protect, getAllBranches)

router.get('/:id', protect, getBranchById)

router.put('/:id', protect, isMasterAdmin, updateBranch)

module.exports = router
