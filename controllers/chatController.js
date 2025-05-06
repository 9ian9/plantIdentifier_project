const ChatHistory = require('../models/ChatHistory');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { setTimeout } = require('timers/promises');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

async function saveChatHistory(message, response, image) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const chatRecord = new ChatHistory({
                message: message || '[Image only]',
                response: response,
                image: image || undefined
            });

            await chatRecord.save();
            logger.info('Chat history saved successfully');
            return true;
        } catch (error) {
            attempt++;
            logger.warn(`Attempt ${attempt} failed to save chat history. ${error.message}`);

            if (attempt === maxRetries) {
                logger.error(`Failed to save after ${maxRetries} attempts:`, error);
                return false;
            }

            // Chờ trước khi thử lại
            await setTimeout(1000 * attempt);
        }
    }
}

exports.handleChat = [
    upload.single('image'), // Xử lý upload ảnh
    async(req, res) => {
        try {
            const { message } = req.body;
            let imageBase64 = '';

            // Xử lý ảnh nếu có
            if (req.file) {
                imageBase64 = req.file.buffer.toString('base64');
            }

            // Xử lý tin nhắn và tạo phản hồi
            const response = await chatService.processMessage(message || '[Image]');

            // Lưu vào database
            const chatRecord = new ChatHistory({
                message: message || '[Image Upload]',
                response: response,
                image: req.file ? `data:${req.file.mimetype};base64,${imageBase64}` : undefined
            });

            await chatRecord.save();

            res.json({ response });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
];