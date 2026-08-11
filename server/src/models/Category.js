const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Category name is required"], trim: true, maxlength: 60 },
    nameAr: { type: String, default: "", trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 500 },
    descriptionAr: { type: String, default: "", maxlength: 500 },
    icon: { type: String, default: "Store" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    nameAr: this.nameAr,
    slug: this.slug,
    description: this.description,
    descriptionAr: this.descriptionAr,
    icon: this.icon,
    isActive: this.isActive,
  };
};

module.exports = mongoose.model("Category", categorySchema);
