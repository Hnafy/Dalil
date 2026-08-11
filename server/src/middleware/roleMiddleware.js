const { AppError } = require("./errorHandler");

// restrictTo("admin", "manager")
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, "You do not have permission to access this resource."));
  }
  next();
};

module.exports = { restrictTo };
