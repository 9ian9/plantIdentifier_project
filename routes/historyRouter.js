const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const ChatSession = require('../models/ChatHistory');

// Lấy danh sách các phiên chat
router.get('/', async(req, res) => {
    try {
        const sessions = await ChatSession.find()
            .sort({ updatedAt: -1 })
            .limit(20)
            .select('sessionId createdAt updatedAt');
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
});

// Lấy danh sách các phiên chat
router.get('/sessions', chatController.getChatSessions);

// Lấy chi tiết một phiên chat cụ thể
router.get('/session/:sessionId', chatController.getChatSession);
router.put('/session/:sessionId/title', async(req, res) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;

        const updatedSession = await ChatSession.findOneAndUpdate({ sessionId }, { $set: { title } }, { new: true });

        if (!updatedSession) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating session title:', error);
        res.status(500).json({ error: 'Failed to update session title' });
    }
});

module.exports = router;