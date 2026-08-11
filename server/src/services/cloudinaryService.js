const { cloudinary, isConfigured } = require("../config/cloudinary");
const { AppError } = require("../middleware/errorHandler");

/**
 * Upload a single image buffer to Cloudinary.
 * @returns {Promise<{url: string, publicId: string}>}
 */
function uploadImageBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(new AppError(503, "Image uploads are disabled (Cloudinary is not configured)."));
    }
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => {
        if (err) {
          console.error("Cloudinary upload error:", err);
          return reject(new AppError(500, "Image upload failed. Please try again."));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId || !isConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete failed:", err.message);
  }
}

module.exports = { uploadImageBuffer, deleteImage };
