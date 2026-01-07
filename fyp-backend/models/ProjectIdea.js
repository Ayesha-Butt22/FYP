//models/ProjectIdea.js
const mongoose = require("mongoose");

const projectIdea = new mongoose.Schema({
  
  supervisorEmail: { type: String, required: true },
  title: { type: String, required: true },
  
}, { timestamps: true });

module.exports = mongoose.model("ProjectIdea", projectIdea);
