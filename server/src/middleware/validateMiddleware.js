const { validationResult } = require("express-validator");
const { AppError } = require("./errorHandler");

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(". ");
    return next(new AppError(400, message));
  }
  next();
};

module.exports = { runValidation };
