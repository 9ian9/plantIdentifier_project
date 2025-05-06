const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatHistorySchema = new Schema({
    message: { type: String, required: true },
    response: { type: String, required: true },
    image: { type: String }, // Lưu dạng base64
    createdAt: { type: Date, default: Date.now, index: { expires: '30d' } } // Tự động xóa sau 30 ngày
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);