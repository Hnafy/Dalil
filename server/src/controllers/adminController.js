const shopService = require("../services/shopService");
const managerService = require("../services/managerService");
const categoryService = require("../services/categoryService");
const analyticsService = require("../services/analyticsService");
const cloudinaryService = require("../services/cloudinaryService");
const { asyncHandler } = require("../middleware/errorHandler");

// ---------- Shops ----------

const listShops = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
  const data = await shopService.listShopsForAdmin({
    search: req.query.search || "",
    category: req.query.category || "",
    status: req.query.status || "",
    page,
    limit,
  });
  res.json({ success: true, data });
});

const createShop = asyncHandler(async (req, res) => {
  const shop = await shopService.createShop(req.body);
  res.status(201).json({ success: true, data: { shop: shop.toPublicJSON(), message: "Shop created successfully." } });
});

const updateShop = asyncHandler(async (req, res) => {
  const shop = await shopService.updateShop(req.params.id, req.body);
  res.json({ success: true, data: { shop: shop.toPublicJSON(), message: "Shop updated successfully." } });
});

const deleteShop = asyncHandler(async (req, res) => {
  await shopService.deleteShop(req.params.id);
  res.json({ success: true, data: { message: "Shop deleted successfully." } });
});

// ---------- Managers ----------

const listManagers = asyncHandler(async (req, res) => {
  const managers = await managerService.listManagers();
  res.json({ success: true, data: { managers } });
});

const createManager = asyncHandler(async (req, res) => {
  const manager = await managerService.createManager(req.body);
  res.status(201).json({ success: true, data: { manager: manager.toSafeJSON(), message: "Manager created successfully." } });
});

const updateManager = asyncHandler(async (req, res) => {
  const manager = await managerService.updateManager(req.params.id, req.body);
  res.json({ success: true, data: { manager: manager.toSafeJSON(), message: "Manager updated successfully." } });
});

const resetManagerPassword = asyncHandler(async (req, res) => {
  const manager = await managerService.resetPassword(req.params.id, req.body.newPassword);
  res.json({ success: true, data: { manager, message: "Manager password reset successfully." } });
});

const deleteManager = asyncHandler(async (req, res) => {
  await managerService.deleteManager(req.params.id);
  res.json({ success: true, data: { message: "Manager deleted successfully." } });
});

// ---------- Categories ----------

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listAllCategories();
  res.json({ success: true, data: { categories } });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: { category: category.toPublicJSON(), message: "Category created successfully." } });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: { category: category.toPublicJSON(), message: "Category updated successfully." } });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, data: { message: "Category deleted successfully." } });
});

// ---------- Analytics ----------

const getAnalytics = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getAdminOverview();
  res.json({ success: true, data: overview });
});

module.exports = {
  listShops,
  createShop,
  updateShop,
  deleteShop,
  listManagers,
  createManager,
  updateManager,
  resetManagerPassword,
  deleteManager,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAnalytics,
};
