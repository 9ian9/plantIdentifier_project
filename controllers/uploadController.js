const ChatSession = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');
const { predictPlant } = require('../services/plantRecognitionService');
const chatService = require('../services/chatService');
const plantList = require('../models/PlantList');

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
    console.log('Upload sessionId:', req.body.sessionId);
    try {
        let buffer, mimeType, fileName, fileSize, base64Data;
        const userMessage = req.body.userMessage || '[Image Upload]';
        if (req.file) {
            buffer = req.file.buffer;
            mimeType = req.file.mimetype;
            fileName = req.file.originalname;
            fileSize = req.file.size;
        } else if (req.body.image) {
            base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
            mimeType = 'image/jpeg';
            base64Data = req.body.image;
        } else {
            return res.status(400).json({ status: 'error', message: 'No image data provided' });
        }

        // Validate file
        const maxSize = 5 * 1024 * 1024;
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (fileSize && fileSize > maxSize) {
            return res.status(400).json({ status: 'error', message: 'File size too large. Max is 5MB.' });
        }

        if (mimeType && !allowedMimeTypes.includes(mimeType)) {
            return res.status(400).json({ status: 'error', message: 'Invalid file type.' });
        }

        // Predict plant
        const plantClassIndex = await predictPlant(buffer, req.onnxSession);
        const plantClassKey = Object.keys(classNames)[plantClassIndex];
        const plantName = classNames[plantClassKey];

        let botResponse;
        let nlpResult = {};
        if (plantClassIndex === -1) {
            botResponse = 'Xin lỗi, tôi không thể xác định loại cây từ ảnh này. Bạn vui lòng thử lại với ảnh khác rõ nét hơn nhé!';
        } else {
            // Process message with NLP
            console.log('Plant Name:', plantName);
            console.log('User Message:', userMessage);
            const nlpResult = await chatService.processMessage(plantName, userMessage);
            console.log('NLP Result:', nlpResult);

            // Combine recognition message with NLP response
            const recognitionMessage = `Tôi đã nhận diện được đây là :${plantName}. `;
            botResponse = recognitionMessage + (nlpResult.response || 'Bạn muốn biết gì về cây này?');
        }

        // Handle session
        let sessionId = req.body.sessionId;
        if (!sessionId) {
            sessionId = uuidv4();
        }

        let chatSession = await ChatSession.findOne({ sessionId });
        if (!chatSession) {
            chatSession = new ChatSession({
                sessionId,
                title: userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : ''),
                messages: [],
                lastPlantName: plantName
            });
        } else {
            chatSession.lastPlantName = plantName;
        }

        // Add user message with image
        const imageUrl = base64Data || `data:${mimeType};base64,${buffer.toString('base64')}`;
        console.log('userMessage from uploadController:', userMessage);
        chatSession.messages.push({
            role: 'user',
            content: userMessage,
            image: imageUrl,
            timestamp: new Date(),
            fileName,
            fileSize,
            fileType: mimeType
        });

        // Add bot response
        chatSession.messages.push({
            role: 'assistant',
            content: botResponse,
            timestamp: new Date()
        });

        chatSession.updatedAt = new Date();
        await chatSession.save();

        return res.json({
            status: 'success',
            message: 'Image uploaded and plant recognized successfully',
            data: {
                sessionId: chatSession.sessionId,
                imageUrl,
                plantName,
                plantClassIndex,
                fileName,
                fileSize,
                fileType: mimeType,
                botResponse,
                entity: nlpResult.entity || plantName
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ status: 'error', message: 'Error processing image', error: error.message });
    }
};

function generateBotResponse(plantName, userMessage) {
    let response = `Tôi đã nhận diện được đây là cây: ${plantName}.`;
    if (userMessage) {
        response += ` Bạn muốn biết gì về cây này?`;
    } else {
        response += ` Bạn có muốn biết thêm thông tin gì về loại cây này không?`;
    }
    return response;
}

async function saveChatMessage({ sessionId, userMessage, imageUrl, botMessage, fileName, fileSize, mimeType }) {
    if (!sessionId) sessionId = uuidv4();

    let chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
        chatSession = new ChatSession({
            sessionId,
            title: userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : ''),
            messages: []
        });
    }

    chatSession.messages.push({
        role: 'user',
        content: userMessage,
        image: imageUrl,
        timestamp: new Date(),
        fileName,
        fileSize,
        fileType: mimeType
    });

    chatSession.messages.push({
        role: 'assistant',
        content: botMessage,
        timestamp: new Date()
    });

    chatSession.updatedAt = new Date();
    await chatSession.save();
    return chatSession.sessionId;
}