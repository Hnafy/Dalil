const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const { generateToken } = require("../utils/generateToken");

async function login(role, email, password) {
  const user = await User.findOne({ email: String(email || "").toLowerCase().trim() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, "Invalid email or password.");
  }
  if (user.role !== role) {
    throw new AppError(403, "This email is registered with a different account type.");
  }
  if (!user.isActive) {
    throw new AppError(403, "This account has been disabled by the administrator.");
  }
  const token = generateToken(user);
  return { user, token };
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new AppError(400, "Current and new passwords are required.");
  }
  if (String(newPassword).length < 6) {
    throw new AppError(400, "New password must be at least 6 characters long.");
  }
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError(401, "Account not found.");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError(400, "Current password is incorrect.");
  }
  user.password = newPassword;
  await user.save();
  return user.toSafeJSON();
}

module.exports = { login, changePassword };
