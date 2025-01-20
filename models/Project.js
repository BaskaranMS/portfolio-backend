const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortDescription: { type: String, required: true },
  markdownContent: { type: String, required: true },
  coverImage: { type: String, required: true }, // Path to cover image
});

module.exports = mongoose.model("Project", ProjectSchema);
