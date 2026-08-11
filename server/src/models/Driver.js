const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Driver name is required"], trim: true, maxlength: 80 },
    phone: { type: String, required: [true, "Mobile number is required"], unique: true, trim: true, maxlength: 20 },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "tuk_tuk", "private_car", "pickup_truck"],
      required: [true, "Vehicle type is required"],
    },
    photo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

driverSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    vehicleType: this.vehicleType,
    photo: this.photo,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Driver", driverSchema);
