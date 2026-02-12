//Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    template: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        enum: ['CS', 'SE', 'CA', 'CYB'],
        uppercase: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: String,
        default: 'Admin'
    }
}, {
    timestamps: true // createdAt & updatedAt automatically
});

module.exports = mongoose.model('Template', templateSchema);