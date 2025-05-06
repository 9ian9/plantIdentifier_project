const ChatHistory = require('../models/ChatHistory');

exports.handleUpload = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        // Lưu vào database
        const chatRecord = new ChatHistory({
            message: '[Image Upload]',
            response: '',
            image: imageUrl
        });

        await chatRecord.save();

        res.json({
            status: 'success',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
};