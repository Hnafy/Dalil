const authService = require("../services/authService");
const { asyncHandler } = require("../middleware/errorHandler");
const { COOKIE_NAME, cookieOptions, clearCookieOptions } = require("../utils/generateToken");

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login("admin", email, password);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

const managerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login("manager", email, password);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, clearCookieOptions());
  res.json({ success: true, data: { message: "Logged out successfully." } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await authService.changePassword(req.user._id, currentPassword, newPassword);
  res.json({ success: true, data: { user, message: "Password changed successfully." } });
});

module.exports = { adminLogin, managerLogin, logout, me, changePassword };
