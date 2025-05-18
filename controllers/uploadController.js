const ChatSession = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');
const { predictPlant } = require('../services/plantRecognitionService');

const classNames = ['acacia_images', 'aloe_vera_images', 'annona_images', 'apple_images', 'avocado_images', 'banana_images', 'carica_papaya_images', 'cassava_images', 'chili_images', 'coconut_images', 'coffee_images', 'cucumber_images', 'jackfruit_images', 'litchi_images', 'mango_images', 'peanut_images', 'plum_images', 'tea_images', 'tomato_images', 'watermelon_images']; // điền tên lớp của bạn ở đây

exports.handleUpload = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded.'
            });
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file type. Only JPEG, PNG, GIF and WEBP images are allowed.'
            });
        }

        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({
                status: 'error',
                message: 'File size too large. Maximum size is 5MB.'
            });
        }

        // Chạy dự đoán cây trên ảnh upload
        const plantClassIndex = await predictPlant(req.file.buffer, req.onnxSession);
        const plantName = classNames[plantClassIndex] || 'Unknown';

        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        const botResponse = `Tôi đã nhận diện cây là: ${plantName}. Cảm ơn bạn đã gửi hình ảnh.`;

        let sessionId = req.body.sessionId;
        if (!sessionId) {
            sessionId = uuidv4();
        }

        let chatSession = await ChatSession.findOne({ sessionId });
        if (!chatSession) {
            chatSession = new ChatSession({
                sessionId,
                title: 'New Chat',
                messages: []
            });
        }

        chatSession.messages.push({
            role: 'user',
            content: '[Image Upload]',
            image: imageUrl,
            timestamp: new Date(),
            uploadDate: new Date(),
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: mimeType
        });

        chatSession.messages.push({
            role: 'assistant',
            content: botResponse,
            timestamp: new Date()
        });

        await chatSession.save();

        res.json({
            status: 'success',
            message: 'Image uploaded and plant recognized successfully',
            data: {
                sessionId: chatSession.sessionId,
                imageUrl,
                plantName,
                plantClassIndex,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileType: mimeType,
                uploadDate: new Date(),
                botResponse
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