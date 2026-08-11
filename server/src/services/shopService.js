const Shop = require("../models/Shop");
const Category = require("../models/Category");
const User = require("../models/User");
const Analytics = require("../models/Analytics");
const { AppError } = require("../middleware/errorHandler");
const { makeSlug } = require("../utils/slugify");
const { calculateOpenStatus } = require("../utils/calculateOpenStatus");

const DEFAULT_HOURS = () => ({
  saturday: { isOpen: true, open: "09:00", close: "18:00" },
  sunday: { isOpen: true, open: "09:00", close: "18:00" },
  monday: { isOpen: true, open: "09:00", close: "18:00" },
  tuesday: { isOpen: true, open: "09:00", close: "18:00" },
  wednesday: { isOpen: true, open: "09:00", close: "18:00" },
  thursday: { isOpen: true, open: "09:00", close: "18:00" },
  friday: { isOpen: true, open: "09:00", close: "18:00" },
});

function mergeHours(input) {
  const base = DEFAULT_HOURS();
  if (!input || typeof input !== "object") return base;
  ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"].forEach((key) => {
    if (input[key] && typeof input[key] === "object") {
      base[key] = { ...base[key], ...input[key] };
    }
  });
  return base;
}

async function uniqueSlug(name) {
  const base = makeSlug(name) || "shop";
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Shop.exists({ slug })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

async function listShops({ search = "", category, openNow = false, page = 1, limit = 9, status, sort = "latest" }) {
  const query = {};

  if (status) {
    query.status = status;
  } else {
    query.status = "active";
  }

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (!cat) throw new AppError(404, "Category not found.");
    query.category = cat._id;
  }

  if (search && String(search).trim()) {
    const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
    ];
  }

  const sortOrder = sort === "views" ? { views: -1 } : { createdAt: -1 };

  const baseFind = () =>
    Shop.find(query)
      .populate("category", "name nameAr slug icon")
      .sort(sortOrder);

  let shops;
  let total;

  if (openNow) {
    const all = await baseFind().limit(500);
    const filtered = all.filter((s) => calculateOpenStatus(s.workingHours).isOpen);
    shops = filtered;
    total = filtered.length;
  } else {
    total = await Shop.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    shops = await baseFind().skip((safePage - 1) * limit).limit(limit);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const data = shops.map((s) => ({
    ...s.toPublicJSON(),
    openStatus: calculateOpenStatus(s.workingHours),
  }));

  return { shops: data, pagination: { page: safePage, limit, total, totalPages } };
}

async function getShopBySlug(slug, { includeInactive = false } = {}) {
  const query = { slug };
  if (!includeInactive) query.status = "active";
  const shop = await Shop.findOne(query).populate("category", "name nameAr slug icon description");
  if (!shop) throw new AppError(404, "Shop not found.");
  return shop;
}

async function getShopById(id) {
  const shop = await Shop.findById(id).populate("category", "name nameAr slug icon");
  if (!shop) throw new AppError(404, "Shop not found.");
  return shop;
}

async function createShop(data) {
  const category = await Category.findById(data.category);
  if (!category) throw new AppError(400, "Selected category does not exist.");

  const payload = {
    name: String(data.name).trim(),
    nameAr: data.nameAr || "",
    slug: await uniqueSlug(data.name),
    description: data.description || "",
    descriptionAr: data.descriptionAr || "",
    category: data.category,
    phone: data.phone || "",
    whatsapp: data.whatsapp || "",
    address: data.address || "",
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    googleMapsUrl: data.googleMapsUrl || "",
    socialLinks: {
      facebook: data.socialLinks?.facebook || "",
      instagram: data.socialLinks?.instagram || "",
      tiktok: data.socialLinks?.tiktok || "",
      website: data.socialLinks?.website || "",
    },
    workingHours: mergeHours(data.workingHours),
    images: [],
    status: data.status === "inactive" ? "inactive" : "active",
  };

  const shop = await Shop.create(payload);

  if (data.managerId) {
    const manager = await User.findOne({ _id: data.managerId, role: "manager" });
    if (manager && manager.isActive) {
      manager.shop = shop._id;
      await manager.save();
      shop.manager = manager._id;
      await shop.save();
    }
  }

  return shop;
}

async function updateShop(id, data) {
  const shop = await Shop.findById(id);
  if (!shop) throw new AppError(404, "Shop not found.");

  if (data.name !== undefined && String(data.name).trim() !== shop.name) {
    shop.name = String(data.name).trim();
    shop.slug = await uniqueSlug(shop.name);
  }
  if (data.nameAr !== undefined) shop.nameAr = data.nameAr;

  const fields = ["description", "descriptionAr", "phone", "whatsapp", "address", "latitude", "longitude", "googleMapsUrl", "status"];
  fields.forEach((f) => {
    if (data[f] !== undefined) shop[f] = data[f];
  });

  if (data.category) {
    const category = await Category.findById(data.category);
    if (!category) throw new AppError(400, "Selected category does not exist.");
    shop.category = data.category;
  }

  if (data.socialLinks && typeof data.socialLinks === "object") {
    ["facebook", "instagram", "tiktok", "website"].forEach((k) => {
      if (data.socialLinks[k] !== undefined) shop.socialLinks[k] = data.socialLinks[k];
    });
  }

  if (data.workingHours && typeof data.workingHours === "object") {
    shop.workingHours = mergeHours(data.workingHours);
  }

  if (data.managerId !== undefined) {
    if (data.managerId) {
      const manager = await User.findOne({ _id: data.managerId, role: "manager" });
      if (!manager) throw new AppError(400, "Selected manager does not exist.");
      manager.shop = shop._id;
      await manager.save();
      shop.manager = manager._id;
    } else {
      if (shop.manager) {
        await User.updateOne({ _id: shop.manager }, { $unset: { shop: 1 } });
      }
      shop.manager = null;
    }
  }

  await shop.save();
  return shop;
}

async function deleteShop(id) {
  const shop = await Shop.findById(id);
  if (!shop) throw new AppError(404, "Shop not found.");

  if (shop.manager) {
    await User.updateOne({ _id: shop.manager }, { $unset: { shop: 1 } });
  }
  await Analytics.deleteMany({ shop: shop._id });
  await Shop.deleteOne({ _id: shop._id });
  return shop;
}

async function listShopsForAdmin({ search = "", category, status, page = 1, limit = 20 }) {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search && String(search).trim()) {
    const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.name = { $regex: term, $options: "i" };
  }

  const total = await Shop.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const shops = await Shop.find(query)
    .populate("category", "name nameAr slug icon")
    .populate("manager", "name email")
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit);

  return {
    shops: shops.map((s) => ({
      ...s.toPublicJSON(),
      category: s.category,
      manager: s.manager,
    })),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

module.exports = {
  listShops,
  getShopBySlug,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  listShopsForAdmin,
  mergeHours,
  uniqueSlug,
};
