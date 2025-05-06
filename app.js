const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.json());
const chatRouter = require('./routes/chatRouter');
const connectDB = require('./config/database');
const { PORT } = require('./config/constants');
const mongoose = require('mongoose');

// Cấu hình cơ bản
app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(express.json());
app.use('/chat', chatRouter);
// Routes tạm thời
app.get('/', (req, res) => {
    res.render('index', { uploadedImage: null });
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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