const shopService = require("../services/shopService");
const { asyncHandler } = require("../middleware/errorHandler");
const { calculateOpenStatus } = require("../utils/calculateOpenStatus");

const listShops = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 9), 60);
  const data = await shopService.listShops({
    search: req.query.search || "",
    category: req.query.category || "",
    openNow: req.query.openNow === "true",
    sort: req.query.sort === "views" ? "views" : "latest",
    page,
    limit,
  });
  res.json({ success: true, data });
});

const getShopBySlug = asyncHandler(async (req, res) => {
  const shop = await shopService.getShopBySlug(req.params.slug);
  res.json({
    success: true,
    data: { ...shop.toPublicJSON(), openStatus: calculateOpenStatus(shop.workingHours) },
  });
});

module.exports = { listShops, getShopBySlug };
