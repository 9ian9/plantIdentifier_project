const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

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

// Lấy chi tiết một phiên chat cụ thể
router.get('/:sessionId', chatController.getChatHistory);

router.get('/sessions', async(req, res) => {
    try {
        const sessions = await ChatSession.find()
            .sort({ updatedAt: -1 })
            .select('sessionId createdAt updatedAt');
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
});

module.exports = router;