const Analytics = require("../models/Analytics");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Category = require("../models/Category");
const { AppError } = require("../middleware/errorHandler");
const { localDayString, dayStringOffset } = require("../utils/dateHelpers");

const CLICK_TYPES = new Set([
  "phone_click",
  "whatsapp_click",
  "maps_click",
  "website_click",
  "facebook_click",
  "instagram_click",
  "tiktok_click",
]);

async function recordView(shopId, visitorId) {
  if (!visitorId) throw new AppError(400, "Visitor id is required.");
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Shop not found.");

  const day = localDayString();
  const res = await Analytics.updateOne(
    { shop: shopId, type: "view", visitorId: String(visitorId).slice(0, 100), day },
    { $setOnInsert: { count: 1 } },
    { upsert: true }
  );
  if (res.upsertedCount === 1) {
    await Shop.updateOne({ _id: shopId }, { $inc: { views: 1 } });
  }
  return true;
}

async function recordClick(shopId, visitorId, type) {
  if (!visitorId) throw new AppError(400, "Visitor id is required.");
  if (!CLICK_TYPES.has(type)) throw new AppError(400, "Invalid click type.");
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Shop not found.");

  const day = localDayString();
  await Analytics.updateOne(
    { shop: shopId, type, visitorId: String(visitorId).slice(0, 100), day },
    { $inc: { count: 1 } },
    { upsert: true }
  );
  return true;
}

function fillTrend(startDay, endDay, rows) {
  const map = new Map(rows.map((r) => [r._id, r.total]));
  const out = [];
  let d = new Date(`${startDay}T00:00:00`);
  const end = new Date(`${endDay}T00:00:00`);
  while (d <= end) {
    const key = localDayString(d);
    out.push({ day: key, total: map.get(key) || 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

async function getAdminOverview() {
  const [totalShops, activeShops, inactiveShops, totalManagers, totalCategories, viewSum] = await Promise.all([
    Shop.countDocuments({}),
    Shop.countDocuments({ status: "active" }),
    Shop.countDocuments({ status: "inactive" }),
    User.countDocuments({ role: "manager" }),
    Category.countDocuments({}),
    Analytics.aggregate([
      { $match: { type: "view" } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]),
  ]);

  const totalViews = viewSum[0]?.total || 0;
  const today = localDayString();
  const weekStart = dayStringOffset(today, -6);
  const monthStart = `${today.slice(0, 7)}-01`;

  const sumViews = async (match) => {
    const rows = await Analytics.aggregate([
      { $match: { type: "view", ...match } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    return rows[0]?.total || 0;
  };

  const [viewsToday, viewsWeek, viewsMonth] = await Promise.all([
    sumViews({ day: today }),
    sumViews({ day: { $gte: weekStart, $lte: today } }),
    sumViews({ day: { $gte: monthStart, $lte: today } }),
  ]);

  const [trendRows, topRows] = await Promise.all([
    Analytics.aggregate([
      { $match: { type: "view", day: { $gte: weekStart, $lte: today } } },
      { $group: { _id: "$day", total: { $sum: "$count" } } },
      { $sort: { _id: 1 } },
    ]),
    Analytics.aggregate([
      { $match: { type: "view" } },
      { $group: { _id: "$shop", total: { $sum: "$count" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: "$shop" },
      { $project: { _id: 0, shopId: "$shop._id", name: "$shop.name", nameAr: "$shop.nameAr", slug: "$shop.slug", views: "$total" } },
    ]),
  ]);

  return {
    totals: { totalShops, activeShops, inactiveShops, totalManagers, totalCategories, totalViews },
    ranges: { viewsToday, viewsWeek, viewsMonth },
    trend: fillTrend(weekStart, today, trendRows),
    topShops: topRows,
  };
}

async function getManagerOverview(shopId) {
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Shop not found.");

  const today = localDayString();
  const weekStart = dayStringOffset(today, -6);
  const monthStart = `${today.slice(0, 7)}-01`;

  const sum = async (match) => {
    const rows = await Analytics.aggregate([
      { $match: { shop: shopId, ...match } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    return rows[0]?.total || 0;
  };

  const [totalViews, viewsToday, viewsWeek, viewsMonth, trendRows, clickRows] = await Promise.all([
    sum({ type: "view" }),
    sum({ type: "view", day: today }),
    sum({ type: "view", day: { $gte: weekStart, $lte: today } }),
    sum({ type: "view", day: { $gte: monthStart, $lte: today } }),
    Analytics.aggregate([
      { $match: { shop: shopId, type: "view", day: { $gte: weekStart, $lte: today } } },
      { $group: { _id: "$day", total: { $sum: "$count" } } },
      { $sort: { _id: 1 } },
    ]),
    Analytics.aggregate([
      { $match: { shop: shopId, type: { $ne: "view" } } },
      { $group: { _id: "$type", total: { $sum: "$count" } } },
    ]),
  ]);

  const clicks = {};
  clickRows.forEach((r) => {
    clicks[r._id] = r.total;
  });

  return {
    shop: { id: shop._id, name: shop.name, nameAr: shop.nameAr, slug: shop.slug, views: shop.views },
    totals: { totalViews },
    ranges: { viewsToday, viewsWeek, viewsMonth },
    clicks,
    trend: fillTrend(weekStart, today, trendRows),
  };
}

module.exports = { recordView, recordClick, getAdminOverview, getManagerOverview };
