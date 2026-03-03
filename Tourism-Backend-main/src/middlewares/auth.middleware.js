const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId =
      decoded.userId ||
      decoded.id ||
      decoded._id ||
      (decoded.user && decoded.user.id);

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = await User.findById(userId).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
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
