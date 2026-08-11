const Shop = require("../models/Shop");
const shopService = require("../services/shopService");
const analyticsService = require("../services/analyticsService");
const cloudinaryService = require("../services/cloudinaryService");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { calculateOpenStatus } = require("../utils/calculateOpenStatus");

function requireAssignedShop(req) {
  if (!req.user || !req.user.shop) {
    throw new AppError(400, "No shop is assigned to your account. Contact the administrator.");
  }
  return req.user.shop;
}

const getMyShop = asyncHandler(async (req, res) => {
  const shopId = requireAssignedShop(req);
  const shop = await Shop.findById(shopId).populate("category", "name nameAr slug icon");
  if (!shop) throw new AppError(404, "Assigned shop not found.");
  res.json({
    success: true,
    data: { ...shop.toPublicJSON(), openStatus: calculateOpenStatus(shop.workingHours) },
  });
});

const updateMyShop = asyncHandler(async (req, res) => {
  const shopId = requireAssignedShop(req);
  // Authorization is derived from req.user.shop — a shopId from the client is never trusted.
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Assigned shop not found.");

  const allowed = ["description", "descriptionAr", "phone", "whatsapp", "address", "latitude", "longitude", "googleMapsUrl", "nameAr"];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) shop[f] = req.body[f];
  });

  if (req.body.socialLinks && typeof req.body.socialLinks === "object") {
    ["facebook", "instagram", "tiktok", "website"].forEach((k) => {
      if (req.body.socialLinks[k] !== undefined) shop.socialLinks[k] = req.body.socialLinks[k];
    });
  }

  await shop.save();
  res.json({ success: true, data: { shop: shop.toPublicJSON(), message: "Shop updated successfully." } });
});

const addImages = asyncHandler(async (req, res) => {
  const shopId = requireAssignedShop(req);
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Assigned shop not found.");

  const files = req.files || [];
  if (files.length === 0) throw new AppError(400, "Please select at least one image.");

  const uploaded = [];
  for (const file of files) {
    const result = await cloudinaryService.uploadImageBuffer(file.buffer, `dalil/shops/${shopId}`);
    uploaded.push(result);
  }

  shop.images = [...shop.images, ...uploaded];
  await shop.save();

  res.status(201).json({ success: true, data: { images: shop.images, message: `${uploaded.length} image(s) uploaded.` } });
});

const deleteImage = asyncHandler(async (req, res) => {
  const shopId = requireAssignedShop(req);
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Assigned shop not found.");

  const image = shop.images.id(req.params.imageId);
  if (!image) throw new AppError(404, "Image not found.");

  await cloudinaryService.deleteImage(image.publicId);
  shop.images.pull({ _id: image._id });
  await shop.save();

  res.json({ success: true, data: { images: shop.images, message: "Image deleted." } });
});

const updateWorkingHours = asyncHandler(async (req, res) => {
  const shopId = requireAssignedShop(req);
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Assigned shop not found.");
  shop.workingHours = shopService.mergeHours(req.body.workingHours || {});
  await shop.save();
  res.json({ success: true, data: { workingHours: shop.workingHours, message: "Working hours updated." } });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const shopId = requireAssignedShop(req);
  const overview = await analyticsService.getManagerOverview(shopId);
  res.json({ success: true, data: overview });
});

module.exports = {
  getMyShop,
  updateMyShop,
  addImages,
  deleteImage,
  updateWorkingHours,
  getAnalytics,
};
