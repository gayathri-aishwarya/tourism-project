const ApiError = require("../utils/apiError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.log(err);

  // If the error is an instance of our custom ApiError, use its properties
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ApiError(400, message);
    return res
      .status(error.statusCode)
      .json({ success: false, message: error.message });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered for: ${field}. Please use another value.`;
    error = new ApiError(400, message);
    return res
      .status(error.statusCode)
      .json({ success: false, message: error.message });
  }

  // For any other unexpected errors, send a generic 500 response
  return res.status(500).json({
    success: false,
    message: "An unexpected internal server error occurred.",
  });
};

module.exports = errorHandler;
