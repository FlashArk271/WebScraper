const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: String,
  originalContent: String,
  updatedContent: String,
  sourceUrl: String,
  references: [String],
}, { timestamps: true });

module.exports = mongoose.model("Article", ArticleSchema);
