const ChatSession = require('../models/ChatHistory');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Tạo hoặc cập nhật phiên chat
async function updateChatSession(sessionId, role, content, image = null) {
    try {
        const update = {
            $push: {
                messages: {
                    role,
                    content,
                    image: image ? `data:image/jpeg;base64,${image}` : undefined
                }
            },
            $set: { updatedAt: new Date() }
        };

        if (!sessionId) {
            // Tạo phiên mới nếu không có sessionId
            const newSessionId = uuidv4();
            update.$set.sessionId = newSessionId;
            update.$set.createdAt = new Date();

            await ChatSession.create({
                sessionId: newSessionId,
                messages: [{
                    role,
                    content,
                    image: image ? `data:image/jpeg;base64,${image}` : undefined
                }]
            });

            return newSessionId;
        } else {
            // Cập nhật phiên hiện có
            await ChatSession.findOneAndUpdate({ sessionId },
                update, { upsert: false }
            );
            return sessionId;
        }
    } catch (error) {
        logger.error('Error updating chat session:', error);
        throw error;
    }
}

exports.handleChat = [
    upload.single('image'),
    async(req, res) => {
        try {
            const { message, sessionId } = req.body;
            let imageBase64 = '';

            if (req.file) {
                imageBase64 = req.file.buffer.toString('base64');
            }

            // Xử lý tin nhắn
            const response = await chatService.processMessage(message || '[Image]');

            // Lưu tin nhắn người dùng
            const newSessionId = await updateChatSession(
                sessionId,
                'user',
                message || '[Image Upload]',
                imageBase64
            );

            // Lưu phản hồi của bot
            await updateChatSession(
                newSessionId,
                'assistant',
                response
            );

            res.json({
                response,
                sessionId: newSessionId
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
];

// Lấy lịch sử chat theo phiên
exports.getChatHistory = async(req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await ChatSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
};