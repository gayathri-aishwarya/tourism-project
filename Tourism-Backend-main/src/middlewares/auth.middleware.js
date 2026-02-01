const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware to verify the JWT token and attach user to the request
exports.protect = async (req, res, next) => {
  let token;

  // Check if the token is in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "No user found with this token" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware to check if the user has the 'master_admin' role
exports.isMasterAdmin = (req, res, next) => {
  if (req.user && req.user.role === "master_admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Forbidden: Access is restricted to master admins." });
  }
};

// Middleware to check if the user has the required permission(s).
exports.checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];

    const hasAllPermissions = requiredPermissions.every((p) =>
      userPermissions.includes(p)
    );

    if (hasAllPermissions) {
      next();
    } else {
      return res.status(403).json({
        message:
          "Forbidden: You do not have the required permissions to perform this action.",
      });
    }
  };
};
