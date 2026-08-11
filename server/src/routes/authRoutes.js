const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { runValidation } = require("../middleware/validateMiddleware");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
});

const loginValidators = [
  body("email").trim().isEmail().withMessage("A valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

router.post("/admin/login", loginLimiter, loginValidators, runValidation, authController.adminLogin);
router.post("/manager/login", loginLimiter, loginValidators, runValidation, authController.managerLogin);

router.post("/logout", authController.logout);

router.get("/me", protect, authController.me);

router.patch(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  runValidation,
  authController.changePassword
);

module.exports = router;
