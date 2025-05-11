const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

// Import middleware
const errorHandler = require('./middlewares/errorHandler');

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
const uploadController = require('./controllers/uploadController');
const connectDB = require('./config/database');
const { PORT } = require('./config/constants');
const mongoose = require('mongoose');

// Định nghĩa routes
app.use('/chat', chatRouter);
app.use('/chat/history', chatHistoryRouter);
app.post('/upload', upload.single('image'), uploadController.handleUpload);
app.get('/', chatController.renderIndex);

// Error handling middleware (phải đặt sau tất cả các routes)
app.use(errorHandler);

(async() => {
    try {
        await connectDB();

        // Khởi động server sau khi kết nối DB thành công
        app.listen(PORT, () => {
            console.log(`Server running on:  http://localhost:${PORT}`);
        });

        // Thêm listener để kiểm tra trạng thái kết nối
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
// Khởi động server
// app.listen(port, () => {
//     console.log(`App is running at http://localhost:${port}`);
// });

module.exports = app;