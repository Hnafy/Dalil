const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, asyncHandler } = require("./errorHandler");
const { COOKIE_NAME } = require("../utils/generateToken");

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) throw new AppError(401, "Not authenticated. Please log in.");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError(401, "Invalid or expired session. Please log in again.");
  }

  const user = await User.findById(payload.id).select("+password");
  if (!user) throw new AppError(401, "Account no longer exists.");
  if (!user.isActive) throw new AppError(403, "This account has been disabled.");

  req.user = user;
  next();
});

module.exports = { protect };
