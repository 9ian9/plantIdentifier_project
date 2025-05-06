const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');

router.get('/', async(req, res) => {
    try {
        const history = await ChatHistory.find().sort({ createdAt: -1 }).limit(50);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

module.exports = router;