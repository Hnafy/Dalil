const express = require("express");
const shopController = require("../controllers/shopController");

const router = express.Router();

// NOTE: /search must be registered before /:slug
router.get("/search", shopController.listShops);
router.get("/", shopController.listShops);
router.get("/:slug", shopController.getShopBySlug);

module.exports = router;
