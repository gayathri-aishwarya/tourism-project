const userService = require('../services/user.service')

// Controller to handle creating a new employee
exports.createEmployee = async (req, res) => {
    try {
        const newEmployee = await userService.createEmployee(req.body)
        // 201 Created
        res.status(201).json(newEmployee)
    } catch (error) {
        // 409 Conflict if user exists, 400 for other validation errors
        const statusCode = error.message.includes('exists') ? 409 : 400
        res.status(statusCode).json({ message: error.message })
    }
}

// Controller to get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await userService.getAllEmployees()
        // 200 OK
        res.status(200).json(employees)
    } catch (error) {
        // 500 Internal Server Error
        res.status(500).json({
            message: 'An error occurred while fetching employees.',
        })
    }
}

// Controller to update employee permissions
exports.updateEmployeePermissions = async (req, res) => {
    try {
        const { id } = req.params // Employee ID from URL
        const { permissions } = req.body // Permissions from request body

        if (!Array.isArray(permissions)) {
            return res
                .status(400)
                .json({ message: 'Permissions must be an array.' })
        }

        const updatedEmployee = await userService.updateEmployeePermissions(
            id,
            permissions
        )
        // 200 OK
        res.status(200).json(updatedEmployee)
    } catch (error) {
        // 404 Not Found if employee doesn't exist
        const statusCode = error.message.includes('not found') ? 404 : 400
        res.status(statusCode).json({ message: error.message })
    }
}

// Controller to delete an employee
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params // Employee ID from URL
        await userService.deleteEmployee(id)
        // 204 No Content is also a good option here
        res.status(200).json({ message: 'Employee successfully deleted.' })
    } catch (error) {
        // 404 Not Found
        const statusCode = error.message.includes('not found') ? 404 : 400
        res.status(statusCode).json({ message: error.message })
    }
}

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params
        const user = await userService.getUserById(id)
        // 200 OK
        res.status(200).json(user)
    } catch (error) {
        // 404 if not found, otherwise 400
        const statusCode = error.message.includes('not found') ? 404 : 400
        res.status(statusCode).json({ message: error.message })
    }
}
