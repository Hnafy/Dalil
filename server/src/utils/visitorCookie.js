const VISITOR_COOKIE_NAME = "dalil_visitor";
const VISITOR_COOKIE_MAX_AGE_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years

function visitorCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: VISITOR_COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

function isValidVisitorId(value) {
  return typeof value === "string" && value.trim().length >= 6 && value.trim().length <= 100;
}

module.exports = { VISITOR_COOKIE_NAME, visitorCookieOptions, isValidVisitorId };
