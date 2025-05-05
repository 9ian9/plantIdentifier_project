const chatService = require('../services/chatService');
const logger = require('../utils/logger');

exports.handleChat = async(req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Invalid message format',
                details: 'Message must be a non-empty string'
            });
        }

        const response = chatService.processMessage(message);

        logger.info(`Chat interaction - Input: ${message} | Output: ${response}`);

        res.json({
            response,
            context: context || {}, // Có thể sử dụng để duy trì ngữ cảnh
            timestamp: new Date().toISOString(),
            status: 'success'
        });
    } catch (error) {
        next(error);
    }
};