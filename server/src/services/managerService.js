const User = require("../models/User");
const Shop = require("../models/Shop");
const { AppError } = require("../middleware/errorHandler");

async function listManagers() {
  const managers = await User.find({ role: "manager" }).populate("shop", "name slug").sort({ createdAt: -1 });
  return managers.map((m) => ({ ...m.toSafeJSON(), shop: m.shop }));
}

async function createManager({ name, email, password, shopId, isActive }) {
  if (!password || String(password).length < 6) {
    throw new AppError(400, "Temporary password must be at least 6 characters.");
  }
  const shop = await Shop.findById(shopId);
  if (!shop) throw new AppError(404, "Linked shop not found.");

  const existingManager = await User.findOne({ role: "manager", shop: shopId, isActive: true });
  if (existingManager) {
    throw new AppError(409, "This shop already has an active manager.");
  }

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    password,
    role: "manager",
    shop: shopId,
    isActive: isActive !== false,
  });

  shop.manager = user._id;
  await shop.save();
  return user;
}

async function updateManager(id, { name, email, shopId, isActive }) {
  const user = await User.findById(id);
  if (!user || user.role !== "manager") throw new AppError(404, "Manager not found.");

  if (email && email.toLowerCase().trim() !== user.email) {
    const dup = await User.findOne({ email: email.toLowerCase().trim() });
    if (dup) throw new AppError(409, "Email is already in use.");
    user.email = email.toLowerCase().trim();
  }
  if (name !== undefined) user.name = String(name).trim();

  const previousShopId = user.shop ? user.shop.toString() : null;
  const nextShopId = shopId ? String(shopId) : null;

  if (nextShopId && nextShopId !== previousShopId) {
    const shop = await Shop.findById(nextShopId);
    if (!shop) throw new AppError(404, "Linked shop not found.");
    const other = await User.findOne({ role: "manager", shop: nextShopId, _id: { $ne: id }, isActive: true });
    if (other) throw new AppError(409, "That shop already has an active manager.");

    if (previousShopId) {
      await Shop.updateOne({ _id: previousShopId }, { $unset: { manager: 1 } });
    }
    user.shop = nextShopId;
    shop.manager = user._id;
    await shop.save();
  }

  if (isActive !== undefined) user.isActive = isActive;

  if (!user.isActive && user.shop) {
    await Shop.updateOne({ _id: user.shop }, { $unset: { manager: 1 } });
  } else if (user.isActive && user.shop && user._id) {
    await Shop.updateOne({ _id: user.shop }, { manager: user._id });
  }

  await user.save();
  return user;
}

async function resetPassword(id, newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    throw new AppError(400, "New password must be at least 6 characters.");
  }
  const user = await User.findById(id);
  if (!user || user.role !== "manager") throw new AppError(404, "Manager not found.");
  user.password = newPassword;
  await user.save();
  return user.toSafeJSON();
}

async function deleteManager(id) {
  const user = await User.findById(id);
  if (!user || user.role !== "manager") throw new AppError(404, "Manager not found.");
  if (user.shop) {
    await Shop.updateOne({ _id: user.shop }, { $unset: { manager: 1 } });
  }
  await User.deleteOne({ _id: user._id });
  return user.toSafeJSON();
}

module.exports = { listManagers, createManager, updateManager, resetPassword, deleteManager };
