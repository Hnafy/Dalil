const slugify = require("slugify");

const makeSlug = (value) =>
  slugify(String(value || ""), { lower: true, strict: true, trim: true });

module.exports = { makeSlug };
