const ChatSession = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');

exports.handleUpload = async(req, res) => {
    try {
        // Validate file existence
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded.'
            });
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file type. Only JPEG, PNG, GIF and WEBP images are allowed.'
            });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (req.file.size > maxSize) {
            return res.status(400).json({
                status: 'error',
                message: 'File size too large. Maximum size is 5MB.'
            });
        }

        // Convert image to base64
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        // Tạo phản hồi từ chatbot
        const botResponse = "Tôi đã nhận được hình ảnh của bạn. Trong tương lai, tôi sẽ được huấn luyện để nhận diện và phân tích hình ảnh này. Hiện tại, tôi chỉ có thể xác nhận rằng hình ảnh đã được tải lên thành công.";

        // Tạo session mới hoặc lấy session hiện tại
        let sessionId = req.body.sessionId;
        if (!sessionId) {
            sessionId = uuidv4();
        }

        // Tìm hoặc tạo session mới
        let chatSession = await ChatSession.findOne({ sessionId });
        if (!chatSession) {
            chatSession = new ChatSession({
                sessionId,
                title: 'New Chat',
                messages: []
            });
        }

        // Thêm message mới vào session
        const userMessage = {
            role: 'user',
            content: '[Image Upload]',
            image: imageUrl,
            timestamp: new Date(),
            uploadDate: new Date(),
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: mimeType
        };

        const botMessage = {
            role: 'assistant',
            content: botResponse,
            timestamp: new Date()
        };

        chatSession.messages.push(userMessage, botMessage);
        await chatSession.save();

        // Return success response with HTML for both messages
        res.json({
            status: 'success',
            message: 'Image uploaded successfully',
            data: {
                sessionId: chatSession.sessionId,
                messages: [{
                        type: 'user',
                        html: `<div class="user-message">
                                <img src="${imageUrl}" style="max-width:150px; border-radius:8px;"/>
                              </div>`
                    },
                    {
                        type: 'bot',
                        html: `<div class="bot-message">
                                ${botResponse}
                              </div>`
                    }
                ]
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error processing image',
            error: error.message
        });
    }
};