const ChatSession = require('../models/ChatHistory');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Tạo hoặc cập nhật phiên chat
// Trong chatController.js
async function updateChatSession(sessionId, role, content, image = null) {
    try {
        const messageContent = {
            role,
            content,
            image: image ? `data:image/jpeg;base64,${image}` : undefined
        };

        if (!sessionId) {
            // Tạo phiên mới
            const newSessionId = uuidv4();
            const title = content.substring(0, 30) + (content.length > 30 ? '...' : '');

            await ChatSession.create({
                sessionId: newSessionId,
                messages: [messageContent],
                title: title
            });

            return newSessionId;
        } else {
            // Cập nhật phiên hiện có
            await ChatSession.findOneAndUpdate({ sessionId }, {
                $push: { messages: messageContent },
                $set: { updatedAt: new Date() }
            }, { new: true });
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
// Thêm vào chatController.js
exports.renderIndex = async(req, res) => {
    try {
        const sessions = await ChatSession.find()
            .sort({ updatedAt: -1 })
            .limit(10)
            .select('sessionId messages updatedAt');

        res.render('index', {
            chatSessions: sessions,
            uploadedImage: req.query.uploadedImage || null
        });
    } catch (error) {
        console.error('Error rendering index:', error);
        res.render('index', {
            chatSessions: [],
            uploadedImage: req.query.uploadedImage || null
        });
    }
};
// Trong file chatController.js
exports.getChatSessions = async(req, res) => {
    try {
        const sessions = await ChatSession.find()
            .sort({ updatedAt: -1 })
            .limit(10)
            .select('sessionId title messages updatedAt');

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
};

exports.getChatSession = async(req, res) => {
    try {
        const session = await ChatSession.findOne({
            sessionId: req.params.sessionId
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ error: 'Failed to fetch chat session' });
    }
};