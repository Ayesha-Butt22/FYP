const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  template: { type: String, required: true },   
  department: { type: String, required: true }, 
  filePath: { type: String, required: true },   
}, {
  timestamps: true,
  collection: 'files' // ensure collection name is 'files'
});

module.exports = mongoose.model('files', FileSchema);