const crypto = require("crypto");
const { VISITOR_COOKIE_NAME, visitorCookieOptions, isValidVisitorId } = require("../utils/visitorCookie");

const attachVisitorId = (req, res, next) => {
  const cookieValue = req.cookies[VISITOR_COOKIE_NAME];
  if (isValidVisitorId(cookieValue)) {
    req.visitorId = cookieValue.trim();
    return next();
  }

  const bodyValue = req.body && req.body.visitorId;
  if (isValidVisitorId(bodyValue)) {
    req.visitorId = bodyValue.trim();
    res.cookie(VISITOR_COOKIE_NAME, req.visitorId, visitorCookieOptions());
    return next();
  }

  req.visitorId = crypto.randomUUID();
  res.cookie(VISITOR_COOKIE_NAME, req.visitorId, visitorCookieOptions());
  next();
};

module.exports = { attachVisitorId };
