const app = require("./app");
const connectDB = require("./config/db");
const { configureCloudinary } = require("./config/cloudinary");

let initialized = false;

module.exports = async (req, res) => {
  try {
    if (!initialized) {
      await connectDB();
      configureCloudinary();
      initialized = true;
    }

    return app(req, res);
  } catch (error) {
    console.error("Server initialization error:", error);

    return res.status(500).json({
      success: false,
      message: "Server initialization failed",
    });
  }
};