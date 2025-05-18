// models/ChatHistory.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    image: { type: String }, // base64 image if any
    timestamp: { type: Date, default: Date.now },
    // New fields for image upload details
    uploadDate: { type: Date, default: Date.now },
    fileName: { type: String },
    fileSize: { type: Number },
    fileType: { type: String }
});

const chatSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    title: { type: String, default: 'New Chat' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    messages: [messageSchema]
});

// Add middleware to update updatedAt timestamp
chatSessionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);