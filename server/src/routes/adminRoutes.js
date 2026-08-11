const express = require("express");
const { body, param } = require("express-validator");
const adminController = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { runValidation } = require("../middleware/validateMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect, restrictTo("admin"));

const idParam = [param("id").isMongoId().withMessage("Valid id is required.")];

// ---------- Shops ----------

router.get("/shops", adminController.listShops);

router.post(
  "/shops",
  [
    body("name").trim().notEmpty().withMessage("Shop name is required.").isLength({ max: 120 }),
    body("nameAr").optional().trim().isLength({ max: 120 }),
    body("descriptionAr").optional().isLength({ max: 4000 }),
    body("category").isMongoId().withMessage("Valid category id is required."),
    body("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status."),
    body("latitude").optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude."),
    body("longitude").optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude."),
  ],
  runValidation,
  adminController.createShop
);

router.patch(
  "/shops/:id",
  idParam,
  [
    body("name").optional().trim().isLength({ max: 120 }),
    body("nameAr").optional().trim().isLength({ max: 120 }),
    body("description").optional().isLength({ max: 4000 }),
    body("descriptionAr").optional().isLength({ max: 4000 }),
    body("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status."),
  ],
  runValidation,
  adminController.updateShop
);

router.delete("/shops/:id", idParam, runValidation, adminController.deleteShop);

// ---------- Managers ----------

router.get("/managers", adminController.listManagers);

router.post(
  "/managers",
  [
    body("name").trim().notEmpty().withMessage("Manager name is required.").isLength({ max: 80 }),
    body("email").trim().isEmail().withMessage("A valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Temporary password must be at least 6 characters."),
    body("shopId").isMongoId().withMessage("Valid shop id is required."),
    body("isActive").optional().isBoolean().withMessage("Invalid status."),
  ],
  runValidation,
  adminController.createManager
);

router.patch(
  "/managers/:id",
  idParam,
  [
    body("name").optional().trim().isLength({ max: 80 }),
    body("email").optional().trim().isEmail().withMessage("A valid email is required."),
    body("shopId").optional({ nullable: true }).isMongoId().withMessage("Valid shop id is required."),
    body("isActive").optional().isBoolean().withMessage("Invalid status."),
  ],
  runValidation,
  adminController.updateManager
);

router.post(
  "/managers/:id/reset-password",
  idParam,
  [body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters.")],
  runValidation,
  adminController.resetManagerPassword
);

router.delete("/managers/:id", idParam, runValidation, adminController.deleteManager);

// ---------- Categories ----------

router.get("/categories", adminController.listCategories);

router.post(
  "/categories",
  [
    body("name").trim().notEmpty().withMessage("Category name is required.").isLength({ max: 60 }),
    body("nameAr").optional().trim().isLength({ max: 60 }),
    body("description").optional().isLength({ max: 500 }),
    body("descriptionAr").optional().isLength({ max: 500 }),
    body("icon").optional().isLength({ max: 40 }),
    body("isActive").optional().isBoolean(),
  ],
  runValidation,
  adminController.createCategory
);

router.patch(
  "/categories/:id",
  idParam,
  [
    body("name").optional().trim().isLength({ max: 60 }),
    body("nameAr").optional().trim().isLength({ max: 60 }),
    body("description").optional().isLength({ max: 500 }),
    body("descriptionAr").optional().isLength({ max: 500 }),
    body("icon").optional().isLength({ max: 40 }),
    body("isActive").optional().isBoolean(),
  ],
  runValidation,
  adminController.updateCategory
);

router.delete("/categories/:id", idParam, runValidation, adminController.deleteCategory);

// ---------- Drivers ----------

router.get("/drivers", adminController.listDrivers);

router.get("/drivers/:id", idParam, runValidation, adminController.getDriver);

router.post(
  "/drivers",
  upload.single("photo"),
  [
    body("name").trim().notEmpty().withMessage("Driver name is required.").isLength({ max: 80 }),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required.")
      .isLength({ max: 20 })
      .matches(/^\+?[0-9][0-9\s-]{8,19}$/)
      .withMessage("Enter a valid mobile number."),
    body("vehicleType").isIn(["motorcycle", "tuk_tuk", "private_car", "pickup_truck"]).withMessage("Invalid vehicle type."),
  ],
  runValidation,
  adminController.createDriver
);

router.patch(
  "/drivers/:id",
  idParam,
  upload.single("photo"),
  [
    body("name").optional().trim().isLength({ max: 80 }),
    body("phone")
      .optional()
      .trim()
      .isLength({ max: 20 })
      .matches(/^\+?[0-9][0-9\s-]{8,19}$/)
      .withMessage("Enter a valid mobile number."),
    body("vehicleType").optional().isIn(["motorcycle", "tuk_tuk", "private_car", "pickup_truck"]).withMessage("Invalid vehicle type."),
    body("removePhoto").optional().isBoolean().withMessage("Invalid removePhoto value."),
  ],
  runValidation,
  adminController.updateDriver
);

router.delete("/drivers/:id", idParam, runValidation, adminController.deleteDriver);

// ---------- Analytics ----------

router.get("/analytics", adminController.getAnalytics);

module.exports = router;
