const Driver = require("../models/Driver");
const { AppError } = require("../middleware/errorHandler");
const cloudinaryService = require("./cloudinaryService");

async function listDrivers({ search = "", vehicleType = "", page = 1, limit = 10 }) {
  const query = {};

  if (vehicleType) query.vehicleType = vehicleType;

  if (search && String(search).trim()) {
    const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
    ];
  }

  const [total, drivers, statsRows] = await Promise.all([
    Driver.countDocuments(query),
    Driver.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Driver.aggregate([{ $group: { _id: "$vehicleType", count: { $sum: 1 } } }]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const stats = { total: 0, motorcycle: 0, tuk_tuk: 0, private_car: 0, pickup_truck: 0 };
  statsRows.forEach((r) => {
    stats.total += r.count;
    if (r._id) stats[r._id] = r.count;
  });

  return {
    drivers: drivers.map((d) => d.toPublicJSON()),
    pagination: { page: safePage, limit, total, totalPages },
    stats,
  };
}

async function listPublicDrivers({ vehicleType = "" }) {
  const query = {};
  if (vehicleType) query.vehicleType = vehicleType;

  const [drivers, statsRows] = await Promise.all([
    Driver.find(query).sort({ createdAt: -1 }).select("name phone vehicleType photo"),
    Driver.aggregate([{ $group: { _id: "$vehicleType", count: { $sum: 1 } } }]),
  ]);

  const stats = { total: 0, motorcycle: 0, tuk_tuk: 0, private_car: 0, pickup_truck: 0 };
  statsRows.forEach((r) => {
    stats.total += r.count;
    if (r._id) stats[r._id] = r.count;
  });

  return {
    drivers: drivers.map((d) => ({ id: d._id, name: d.name, phone: d.phone, vehicleType: d.vehicleType, photo: d.photo })),
    stats,
  };
}

async function getDriverById(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError(404, "Driver not found.");
  return driver;
}

async function createDriver({ name, phone, vehicleType, photo }) {
  const dup = await Driver.findOne({ phone: String(phone).trim() });
  if (dup) throw new AppError(409, "A driver with this mobile number already exists.");

  const driver = await Driver.create({
    name: String(name).trim(),
    phone: String(phone).trim(),
    vehicleType,
    photo: photo || undefined,
  });
  return driver;
}

async function updateDriver(id, { name, phone, vehicleType, photo, removePhoto }) {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError(404, "Driver not found.");

  if (phone !== undefined) {
    const p = String(phone).trim();
    if (p !== driver.phone) {
      const dup = await Driver.findOne({ phone: p, _id: { $ne: id } });
      if (dup) throw new AppError(409, "A driver with this mobile number already exists.");
      driver.phone = p;
    }
  }
  if (name !== undefined) driver.name = String(name).trim();
  if (vehicleType !== undefined) driver.vehicleType = vehicleType;

  if (removePhoto) {
    if (driver.photo?.publicId) await cloudinaryService.deleteImage(driver.photo.publicId);
    driver.photo = { url: "", publicId: "" };
  } else if (photo) {
    if (driver.photo?.publicId) await cloudinaryService.deleteImage(driver.photo.publicId);
    driver.photo = photo;
  }

  await driver.save();
  return driver;
}

async function deleteDriver(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError(404, "Driver not found.");
  if (driver.photo?.publicId) await cloudinaryService.deleteImage(driver.photo.publicId);
  await Driver.deleteOne({ _id: driver._id });
  return driver;
}

module.exports = { listDrivers, listPublicDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
