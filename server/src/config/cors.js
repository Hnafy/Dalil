const corsOptions = {
  origin(origin, callback) {
    const allowed = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    // Allow same-origin / non-browser requests (no Origin header).
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

module.exports = corsOptions;
