const branchService = require('../services/branch.service')

// Controller to handle the creation of a new branch.
exports.createBranch = async (req, res, next) => {
    try {
        const branchData = req.body
        const newBranch = await branchService.createBranch(branchData)

        res.status(201).json({
            success: true,
            data: newBranch,
        })
    } catch (error) {
        next(error)
    }
}

// Controller to fetch all branches.
exports.getAllBranches = async (req, res, next) => {
    try {
        const branches = await branchService.getAllBranches()
        res.status(200).json({
            success: true,
            count: branches.length,
            data: branches,
        })
    } catch (error) {
        next(error)
    }
}

// Controller to handle updating an existing branch
exports.updateBranch = async (req, res, next) => {
    try {
        const { id } = req.params
        const updateData = req.body

        const updateBranch = await branchService.updateBranch(id, updateData)

        res.status(200).json({
            success: true,
            data: updateBranch,
        })
    } catch (error) {
        next(error)
    }
}

exports.getBranchById = async (req, res, next) => {
    try {
        const { id } = req.params
        const branch = await branchService.getBranchById(id)
        return res.status(200).json(branch)
    } catch (err) {
        next(err)
    }
}
