require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { configureCloudinary } = require("./config/cloudinary");

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  configureCloudinary();

  // app.listen(PORT, () => {
  //   console.log(`Dalil API running on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`);
  // });
})();
