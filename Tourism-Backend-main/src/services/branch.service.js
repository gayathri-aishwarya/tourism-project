const Branch = require('../models/branch')

// Creates a new branch in the database.
exports.createBranch = async (branchData) => {
    if (!branchData.name || !branchData.address) {
        throw new Error('Please provide a name and location for branch.')
    }

    const newBranch = await Branch.create(branchData)
    return newBranch
}

//Retrieves all branches from the database.

exports.getAllBranches = async () => {
    const branches = await Branch.find()
    return branches
}

//Finds a branch by its ID and updates it with new data.
exports.updateBranch = async (branchId, updateData) => {
    const updatedBranch = await Branch.findByIdAndUpdate(branchId, updateData, {
        new: true,
        runValidators: true,
    })

    if (!updatedBranch) {
        throw new Error('No branch found with that ID.')
    }

    return updatedBranch
}

exports.deleteBranch = async (branchId) => {
    try {
        const deletedBranch = await Branch.findByIdAndDelete(branchId)

        if (!deletedBranch) {
            return {
                message: 'Branch not found',
                branch: null,
            }
        }

        return {
            message: 'Branch deleted successfully',
            branch: deletedBranch,
        }
    } catch (err) {
        throw new Error(`Error deleting branch: ${err.message}`)
    }
}

exports.getBranchById = async (branchId) => {
    try {
        const branch = await Branch.findById(branchId)
        return branch
    } catch (err) {
        throw new Error(`No branch with the given Id`)
    }
}
