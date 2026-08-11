const cloudinary = require("cloudinary").v2;

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const configureCloudinary = () => {
  if (!isConfigured()) {
    console.warn(
      "[cloudinary] Missing CLOUDINARY_* env vars - image uploads will be disabled."
    );
    return false;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
};

module.exports = { cloudinary, configureCloudinary, isConfigured };
