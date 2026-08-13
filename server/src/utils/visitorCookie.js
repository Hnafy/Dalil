const VISITOR_COOKIE_NAME = "dalil_visitor";
const VISITOR_COOKIE_MAX_AGE_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years

const VISITOR_ID_MIN_LENGTH = 6;
const VISITOR_ID_MAX_LENGTH = 100;

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
  return typeof value === "string" && value.trim().length >= VISITOR_ID_MIN_LENGTH && value.trim().length <= VISITOR_ID_MAX_LENGTH;
}

module.exports = { VISITOR_COOKIE_NAME, VISITOR_COOKIE_MAX_AGE_MS, VISITOR_ID_MIN_LENGTH, VISITOR_ID_MAX_LENGTH, visitorCookieOptions, isValidVisitorId };
