const ChatSession = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');
const { predictPlant } = require('../services/plantRecognitionService');

const classNames = {
    'acacia_images': 'Cây Keo',
    'aloe_vera_images': 'Cây Nha Đam',
    'annona_images': 'Cây Mãng Cầu',
    'apple_images': 'Cây Táo',
    'avocado_images': 'Cây Bơ',
    'banana_images': 'Cây Chuối',
    'carica_papaya_images': 'Cây Đu Đủ',
    'cassava_images': 'Cây Sắn',
    'chili_images': 'Cây Ớt',
    'coconut_images': 'Cây Dừa',
    'coffee_images': 'Cây Cà Phê',
    'cucumber_images': 'Cây Dưa Leo',
    'jackfruit_images': 'Cây Mít',
    'litchi_images': 'Cây Vải',
    'mango_images': 'Cây Xoài',
    'peanut_images': 'Cây Đậu Phộng',
    'plum_images': 'Cây Mận',
    'tea_images': 'Cây Trà',
    'tomato_images': 'Cây Cà Chua',
    'watermelon_images': 'Cây Dưa Hấu'
};

exports.handleUpload = async(req, res) => {
    try {
        // Xử lý trường hợp upload qua endpoint /api/upload
        if (req.file) {
            return handleFileUpload(req, res);
        }
        // Xử lý trường hợp upload qua endpoint /chat (base64)
        else if (req.body.image) {
            return handleBase64Upload(req, res);
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'No image data provided'
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error processing image',
            error: error.message
        });
    }
};

async function handleFileUpload(req, res) {
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
    const plantClassKey = Object.keys(classNames)[plantClassIndex];
    const plantName = classNames[plantClassKey] || 'Không xác định';

    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

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
        content: req.body.message || '[Image Upload]',
        image: imageUrl,
        timestamp: new Date(),
        uploadDate: new Date(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: mimeType
    });

    let botResponse = `Tôi đã nhận diện được đây là cây: ${plantName}.`;
    if (req.body.message) {
        botResponse += ` Về câu hỏi "${req.body.message}" của bạn, `;
        botResponse += `đây là một số thông tin cơ bản về ${plantName}:`;
    } else {
        botResponse += ` Bạn có muốn biết thêm thông tin gì về loại cây này không?`;
    }

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
}

async function handleBase64Upload(req, res) {
    try {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Chạy dự đoán cây trên ảnh upload
        const plantClassIndex = await predictPlant(buffer, req.onnxSession);
        const plantClassKey = Object.keys(classNames)[plantClassIndex];
        const plantName = classNames[plantClassKey] || 'Không xác định';

        const imageUrl = `data:image/jpeg;base64,${base64Data}`;

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
            content: req.body.message || '[Image Upload]',
            image: imageUrl,
            timestamp: new Date()
        });

        let botResponse = `Tôi đã nhận diện được đây là cây: ${plantName}.`;
        if (req.body.message) {
            botResponse += ` Về câu hỏi "${req.body.message}" của bạn, `;
            botResponse += `đây là một số thông tin cơ bản về ${plantName}:`;
        } else {
            botResponse += ` Bạn có muốn biết thêm thông tin gì về loại cây này không?`;
        }

        chatSession.messages.push({
            role: 'assistant',
            content: botResponse,
            timestamp: new Date()
        });

        await chatSession.save();

        res.json({
            status: 'success',
            message: 'Image processed and plant recognized successfully',
            data: {
                sessionId: chatSession.sessionId,
                plantName,
                botResponse
            }
        });
    } catch (error) {
        console.error('Base64 upload error:', error);
        throw error;
    }
}