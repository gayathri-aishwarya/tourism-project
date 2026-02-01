const ApiError = require('../utils/apiError');

/**
 * Middleware to require specific roles
 * @param {...String} roles - Roles allowed to access the route
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(`Insufficient permissions. Required role: ${roles.join(', ')}. Your role: ${req.user.role}`, 403));
    }

    next();
  };
};

/**
 * Middleware to require admin role specifically (master_admin)
 */
const requireAdmin = (req, res, next) => {
  return requireRoles('master_admin')(req, res, next);
};

/**
 * Middleware to require employee or admin
 */
const requireStaff = (req, res, next) => {
  return requireRoles('master_admin', 'employee')(req, res, next);
};

module.exports = {
  requireRoles,
  requireAdmin,
  requireStaff
};
