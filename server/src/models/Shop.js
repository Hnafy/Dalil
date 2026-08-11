const mongoose = require("mongoose");

const day = {
  isOpen: { type: Boolean, default: true },
  open: { type: String, default: "09:00" },
  close: { type: String, default: "18:00" },
};

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Shop name is required"], trim: true, maxlength: 120 },
    nameAr: { type: String, default: "", trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 4000 },
    descriptionAr: { type: String, default: "", maxlength: 4000 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: [true, "Category is required"] },

    phone: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },

    address: { type: String, default: "", trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    googleMapsUrl: { type: String, default: "", trim: true },

    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    workingHours: {
      saturday: day,
      sunday: day,
      monday: day,
      tuesday: day,
      wednesday: day,
      thursday: day,
      friday: day,
    },

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
      },
    ],

    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shopSchema.index({ category: 1 });
shopSchema.index({ status: 1 });

shopSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    nameAr: this.nameAr,
    slug: this.slug,
    description: this.description,
    descriptionAr: this.descriptionAr,
    category: this.category,
    phone: this.phone,
    whatsapp: this.whatsapp,
    address: this.address,
    latitude: this.latitude,
    longitude: this.longitude,
    googleMapsUrl: this.googleMapsUrl,
    socialLinks: this.socialLinks,
    workingHours: this.workingHours,
    images: this.images,
    status: this.status,
    views: this.views,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Shop", shopSchema);
