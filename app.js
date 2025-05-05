const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.json());
const chatRouter = require('./routes/chatRouter');
// Cấu hình cơ bản
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use('/chat', chatRouter);
// Routes tạm thời
app.get('/', (req, res) => {
    res.render('index', { uploadedImage: null });
});

// Khởi động server
app.listen(port, () => {
    console.log(`App is running at http://localhost:${port}`);
});

module.exports = app;