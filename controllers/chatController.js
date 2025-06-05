const ChatSession = require('../models/ChatHistory');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Tạo hoặc cập nhật phiên chat
async function updateChatSession(sessionId, role, content) {
    try {
        const messageContent = {
            role,
            content,
            timestamp: new Date()
        };

        let chatSession;
        if (!sessionId) {
            // Tạo phiên mới chỉ khi không có sessionId
            const newSessionId = uuidv4();
            const title = content.substring(0, 30) + (content.length > 30 ? '...' : '');

            chatSession = await ChatSession.create({
                sessionId: newSessionId,
                messages: [messageContent],
                title: title
            });

            return chatSession.sessionId;
        } else {
            // Cập nhật phiên hiện có
            chatSession = await ChatSession.findOneAndUpdate({ sessionId }, {
                $push: { messages: messageContent },
                $set: { updatedAt: new Date() }
            }, { new: true });

            if (!chatSession) {
                // Nếu không tìm thấy session, tạo mới
                const title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
                chatSession = await ChatSession.create({
                    sessionId,
                    messages: [messageContent],
                    title: title
                });
            }

            return chatSession.sessionId;
        }
    } catch (error) {
        logger.error('Error updating chat session:', error);
        throw error;
    }
}

exports.handleChat = async(req, res) => {
    try {
        const { message, userMessage, sessionId } = req.body;

        const nlpResult = await chatService.processMessage(message, userMessage);
        const response = nlpResult && nlpResult.response ? nlpResult.response : nlpResult;

        // Sử dụng updateChatSession để xử lý tin nhắn người dùng
        const currentSessionId = await updateChatSession(sessionId, 'user', userMessage || message);

        // Sử dụng updateChatSession để xử lý phản hồi của bot
        await updateChatSession(currentSessionId, 'assistant', response);

        res.json({
            response,
            sessionId: currentSessionId,
            entity: nlpResult && nlpResult.entity ? nlpResult.entity : null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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