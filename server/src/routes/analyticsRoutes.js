const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const analyticsController = require("../controllers/analyticsController");
const { runValidation } = require("../middleware/validateMiddleware");

const router = express.Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

const eventValidators = [
  body("shopId").isMongoId().withMessage("Valid shop id is required."),
  body("visitorId").trim().isLength({ min: 6, max: 100 }).withMessage("A visitor id is required."),
];

const clickValidators = [
  ...eventValidators,
  body("type")
    .isIn(["phone_click", "whatsapp_click", "maps_click", "website_click", "facebook_click", "instagram_click", "tiktok_click"])
    .withMessage("Invalid click type."),
];

router.post("/view", analyticsLimiter, eventValidators, runValidation, analyticsController.recordView);
router.post("/click", analyticsLimiter, clickValidators, runValidation, analyticsController.recordClick);

module.exports = router;
