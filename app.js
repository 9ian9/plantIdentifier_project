const express = require('express');
const multer = require('multer');
const path = require('path');
const ort = require('onnxruntime-node');
const app = express();
const port = 3000;

// Import middleware
const errorHandler = require('./middlewares/errorHandler');

// Biến toàn cục lưu session ONNX
let onnxSession = null;

// Hàm khởi tạo model ONNX 1 lần khi server start
async function initOnnx() {
    try {
        const modelPath = path.join(__dirname, 'models', 'plant_classifier.onnx');
        onnxSession = await ort.InferenceSession.create(modelPath);
        console.log('ONNX model loaded successfully');
    } catch (err) {
        console.error('Failed to load ONNX model', err);
        process.exit(1);
    }
}

// Cấu hình multer cho upload file
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Cấu hình middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static('public'));

// Cấu hình view engine
app.set('view engine', 'ejs');

// Import routes và controllers
const chatRouter = require('./routes/chatRouter');
const chatController = require('./controllers/chatController');
const chatHistoryRouter = require('./routes/historyRouter');
const uploadRouter = require('./routes/uploadRouter');
const connectDB = require('./config/database');
const { PORT } = require('./config/constants');
const mongoose = require('mongoose');

// Middleware để truyền onnxSession vào request
app.use((req, res, next) => {
    req.onnxSession = onnxSession;
    next();
});

// Định nghĩa routes
app.use('/chat', chatRouter);
app.use('/chat/history', chatHistoryRouter);
app.use('/api/upload', uploadRouter);
app.get('/', chatController.renderIndex);

// Error handling middleware 
app.use(errorHandler);

(async() => {
    try {
        // Khởi tạo model ONNX trước khi kết nối DB
        await initOnnx();
        await connectDB();

        // Khởi động server sau khi kết nối DB thành công
        app.listen(PORT, () => {
            console.log(`Server running on:  http://localhost:${PORT}`);
        });

        // listener để kiểm tra trạng thái kết nối
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });

    } catch (err) {
        console.error('Failed to initialize application:', err);
        process.exit(1);
    }
})();

module.exports = app;