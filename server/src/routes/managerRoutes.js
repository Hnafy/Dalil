const express = require("express");
const { body, param } = require("express-validator");
const managerController = require("../controllers/managerController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { runValidation } = require("../middleware/validateMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect, restrictTo("manager"));

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const hoursValidators = [];
["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"].forEach((dayKey) => {
  hoursValidators.push(
    body(`workingHours.${dayKey}`).optional().isObject(),
    body(`workingHours.${dayKey}.isOpen`).optional().isBoolean(),
    body(`workingHours.${dayKey}.open`).optional({ values: "falsy" }).matches(TIME_RE).withMessage(`${dayKey}: invalid opening time.`),
    body(`workingHours.${dayKey}.close`).optional({ values: "falsy" }).matches(TIME_RE).withMessage(`${dayKey}: invalid closing time.`)
  );
});

router.get("/shop", managerController.getMyShop);

router.patch(
  "/shop",
  [
    body("description").optional().isLength({ max: 4000 }),
    body("nameAr").optional().trim().isLength({ max: 120 }),
    body("descriptionAr").optional().isLength({ max: 4000 }),
    body("phone").optional().isString().isLength({ max: 30 }),
    body("whatsapp").optional().isString().isLength({ max: 30 }),
    body("address").optional().isLength({ max: 300 }),
    body("latitude").optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
    body("longitude").optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
    body("googleMapsUrl").optional({ values: "falsy" }).isURL({ require_protocol: true }).withMessage("Google Maps link must be a valid URL."),
    body("socialLinks").optional().isObject(),
    body("socialLinks.facebook").optional().isString(),
    body("socialLinks.instagram").optional().isString(),
    body("socialLinks.tiktok").optional().isString(),
    body("socialLinks.website").optional().isString(),
  ],
  runValidation,
  managerController.updateMyShop
);

router.post("/shop/images", upload.array("images", 10), managerController.addImages);

router.delete("/shop/images/:imageId", [param("imageId").isMongoId().withMessage("Valid image id is required.")], runValidation, managerController.deleteImage);

router.patch("/shop/working-hours", hoursValidators, runValidation, managerController.updateWorkingHours);

router.get("/analytics", managerController.getAnalytics);

module.exports = router;
