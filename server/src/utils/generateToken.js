const jwt = require("jsonwebtoken");

const COOKIE_NAME = "dalil_token";

function parseExpiryToMs(value) {
  const str = String(value || "7d").trim().toLowerCase();
  const match = str.match(/^(\d+)([smhdw])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000, w: 7 * 24 * 60 * 60 * 1000 };
  return amount * (ms[unit] || ms.d);
}

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: parseExpiryToMs(process.env.JWT_EXPIRES_IN),
    path: "/",
  };
}

function clearCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/" };
}

module.exports = { COOKIE_NAME, generateToken, cookieOptions, clearCookieOptions };
