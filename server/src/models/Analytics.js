const mongoose = require("mongoose");

const EVENT_TYPES = [
  "view",
  "phone_click",
  "whatsapp_click",
  "maps_click",
  "website_click",
  "facebook_click",
  "instagram_click",
  "tiktok_click",
];

const analyticsSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    // Anonymous, non-identifying visitor token generated client-side.
    visitorId: { type: String, required: true, maxlength: 100 },
    // Local calendar day YYYY-MM-DD used for deduplication + daily trends.
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// A view is counted at most once per shop per visitor per day.
// Click events increment the counter instead of creating duplicates.
analyticsSchema.index({ shop: 1, type: 1, visitorId: 1, day: 1 }, { unique: true });
analyticsSchema.index({ day: 1 });
analyticsSchema.index({ type: 1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
