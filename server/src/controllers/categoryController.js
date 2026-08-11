const categoryService = require("../services/categoryService");
const { asyncHandler } = require("../middleware/errorHandler");

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listActiveCategories();
  res.json({ success: true, data: { categories } });
});

module.exports = { listCategories };
