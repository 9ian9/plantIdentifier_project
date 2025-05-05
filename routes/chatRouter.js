const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateChatInput } = require('../middlewares/validators');

router.post('/', validateChatInput, chatController.handleChat);

module.exports = router;