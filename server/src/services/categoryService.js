const Category = require("../models/Category");
const Shop = require("../models/Shop");
const { AppError } = require("../middleware/errorHandler");
const { makeSlug } = require("../utils/slugify");

async function listActiveCategories() {
  const cats = await Category.find({ isActive: true }).sort({ createdAt: 1 });
  const withCounts = await Promise.all(
    cats.map(async (c) => {
      const count = await Shop.countDocuments({ category: c._id, status: "active" });
      return { ...c.toPublicJSON(), shopCount: count };
    })
  );
  return withCounts;
}

async function listAllCategories() {
  return Category.find().sort({ createdAt: 1 });
}

async function createCategory({ name, nameAr, description, descriptionAr, icon, isActive }) {
  const slug = await uniqueSlug(name);
  return Category.create({
    name,
    nameAr: nameAr || "",
    description: description || "",
    descriptionAr: descriptionAr || "",
    icon: icon || "Store",
    isActive: isActive !== false,
    slug,
  });
}

async function uniqueSlug(name) {
  const base = makeSlug(name) || "category";
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Category.exists({ slug })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

async function updateCategory(id, { name, nameAr, description, descriptionAr, icon, isActive }) {
  const cat = await Category.findById(id);
  if (!cat) throw new AppError(404, "Category not found.");
  if (name !== undefined && String(name).trim() !== cat.name) {
    cat.name = String(name).trim();
    cat.slug = await uniqueSlug(cat.name);
  }
  if (nameAr !== undefined) cat.nameAr = nameAr;
  if (description !== undefined) cat.description = description;
  if (descriptionAr !== undefined) cat.descriptionAr = descriptionAr;
  if (icon !== undefined) cat.icon = icon;
  if (isActive !== undefined) cat.isActive = isActive;
  await cat.save();
  return cat;
}

async function deleteCategory(id) {
  const cat = await Category.findById(id);
  if (!cat) throw new AppError(404, "Category not found.");
  const shopsInUse = await Shop.countDocuments({ category: cat._id });
  if (shopsInUse > 0) {
    throw new AppError(400, `Cannot delete "${cat.name}" — ${shopsInUse} shop(s) are using it.`);
  }
  await Category.deleteOne({ _id: cat._id });
  return cat;
}

module.exports = {
  listActiveCategories,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
