1. structure:
   project/
   ├── config/
   │ └── constants.js
   ├── controllers/
   │ ├── chatController.js
   │ └── uploadController.js
   ├── middlewares/
   │ └── errorHandler.js
   ├── models/
   │ └── intents.js
   ├── services/
   │ ├── chatService.js
   │ └── nlpService.js
   ├── utils/
   │ ├── logger.js
   │ └── vietnameseNLP.js
   |** routes/
   | |** chatRouter.js
   | |\_\_ uploadRouter.js  
   ├── app.js
   └── server.js

2. Cài đặt thêm dependencies cần thiết

   - cài đặt thêm package winston cho logging:
     npm install winston
   - npm install winston multer express natural
   - các package bổ sung:
     npm install vntk fast-levenshtein

     - vntk: Thư viện NLP tiếng Việt tốt hơn
     - fast-levenshtein: Tính khoảng cách giữa các từ

   - npm install vntk@latest natural fast-levenshtein

   - npm install express multer sharp onnxruntime-node uuid

Run
Open http://localhost:3000 with your browser to see the result.

3. Khởi động mongodb: mở terminal : mongod
