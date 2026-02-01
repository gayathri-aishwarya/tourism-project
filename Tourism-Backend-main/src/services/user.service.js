const User = require('../models/user')
const bcrypt = require('bcryptjs')

exports.createEmployee = async (employeeData) => {
    const {
        firstName,
        lastName,
        email,
        phone,
        password,
        branch_id,
        permissions,
    } = employeeData

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new Error('User with this email already exists.')
    }

    //Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const employee = new User({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: 'employee',
        branch_id,
        permissions,
    })

    await employee.save()
    employee.password = undefined

    return employee
}

// Service to get all employees
exports.getAllEmployees = async () => {
    // Find all users with the role 'employee' and exclude their passwords
    const employees = await User.find({ role: 'employee' }).select('-password')
    return employees
}

// Service to update an employee's permissions
exports.updateEmployeePermissions = async (employeeId, permissions) => {
    const employee = await User.findByIdAndUpdate(
        employeeId,
        { permissions }, // Update the permissions field
        { new: true, runValidators: true } // Options: return the updated doc, run schema validators
    ).select('-password')

    if (!employee) {
        throw new Error('Employee not found')
    }
    return employee
}

// Service to delete an employee
exports.deleteEmployee = async (employeeId) => {
    const employee = await User.findByIdAndDelete(employeeId)
    if (!employee) {
        throw new Error('Employee not found')
    }
    // Return a success message or the deleted object (without password)
    return { message: 'Employee successfully deleted.' }
}

exports.getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password')
    if (!user) {
        throw new Error('User not found')
    }

    return user
}
