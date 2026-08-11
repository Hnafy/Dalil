const analyticsService = require("../services/analyticsService");
const { asyncHandler } = require("../middleware/errorHandler");

const recordView = asyncHandler(async (req, res) => {
  const { shopId, visitorId } = req.body;
  await analyticsService.recordView(shopId, visitorId);
  res.json({ success: true, data: { recorded: true } });
});

const recordClick = asyncHandler(async (req, res) => {
  const { shopId, visitorId, type } = req.body;
  await analyticsService.recordClick(shopId, visitorId, type);
  res.json({ success: true, data: { recorded: true } });
});

module.exports = { recordView, recordClick };
