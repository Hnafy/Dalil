const { asyncHandler, AppError } = require("../middleware/errorHandler");
const driverService = require("../services/driverService");

const VEHICLE_TYPES = ["motorcycle", "tuk_tuk", "private_car", "pickup_truck"];

const listDrivers = asyncHandler(async (req, res) => {
  const { vehicleType } = req.query;
  if (vehicleType && !VEHICLE_TYPES.includes(vehicleType)) {
    throw new AppError(400, "Invalid vehicle type.");
  }
  const data = await driverService.listPublicDrivers({ vehicleType });
  res.json({ success: true, data });
});

module.exports = { listDrivers };
