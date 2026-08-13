const analyticsService = require("../services/analyticsService");
const { asyncHandler } = require("../middleware/errorHandler");

const getVisitor = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { visitorId: req.visitorId } });
});

const recordView = asyncHandler(async (req, res) => {
  const { shopId } = req.body;
  await analyticsService.recordView(shopId, req.visitorId);
  res.json({ success: true, data: { recorded: true } });
});

const recordClick = asyncHandler(async (req, res) => {
  const { shopId, type } = req.body;
  await analyticsService.recordClick(shopId, req.visitorId, type);
  res.json({ success: true, data: { recorded: true } });
});

module.exports = { getVisitor, recordView, recordClick };
