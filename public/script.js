document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.querySelector('.input-area input[type="text"]');
    const sendButton = document.querySelector('.input-area .send-btn');
    const attachButton = document.querySelector('.input-area .attach-btn');
    const mainContent = document.querySelector('.main-content');
    const chatHistory = document.querySelector('.chat-history');
    const welcomeArea = document.querySelector('.welcome-area');
    const imageUpload = document.getElementById('image-upload');
    let chatStarted = false;

    // Danh sách entity mẫu lấy từ intents.js
    const PLANT_ENTITIES = [
        'đậu phộng', 'vải', 'dưa hấu', 'bơ', 'táo', 'cà phê', 'keo', 'mít', 'đu đủ',
        'dưa leo', 'xoài', 'chuối', 'mận', 'dừa', 'cà chua', 'nha đam', 'trà', 'sắn',
        'mãng cầu', 'ớt', 'tiêu', 'lúa'
    ];

    function setCurrentTopic(topic) {
        localStorage.setItem('currentTopic', topic);
    }

    function getCurrentTopic() {
        return localStorage.getItem('currentTopic') || '';
    }

    sendButton.addEventListener('click', sendMessage);
    // attachButton.addEventListener('click', () => imageUpload.click());
    inputArea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    let currentSessionId = null;
    async function sendMessage() {
        console.log('Đã click gửi tin nhắn');
        let userMessage = inputArea.value.trim(); // message gốc của user
        let messageToSend = userMessage; // message sẽ gửi lên server
        const currentTopic = getCurrentTopic();
        const containsAnyEntity = PLANT_ENTITIES.some(entity =>
            userMessage.toLowerCase().includes(entity)
        );
        if (currentTopic && !containsAnyEntity) {
            messageToSend = userMessage + ' ' + currentTopic;
        }
        console.log('Message gửi lên server:', messageToSend);
        const hasImage = imageUpload.files && imageUpload.files.length > 0;

        if (userMessage || hasImage) {
            if (!chatStarted) {
                welcomeArea.style.display = 'none';
                chatStarted = true;
                currentSessionId = null; // Reset session khi bắt đầu chat mới
            }

            // Hiển thị đúng message gốc của user
            if (userMessage) {
                const userBubble = document.createElement('div');
                userBubble.classList.add('user-message');
                userBubble.textContent = userMessage;
                chatHistory.appendChild(userBubble);
            }

            // Hiển thị ảnh nếu có
            if (hasImage) {
                // ... (phần hiển thị ảnh giữ nguyên)
            }

            scrollToBottom();
            inputArea.value = '';

            // Chuyển ảnh sang base64 nếu có
            let imageBase64 = '';
            if (hasImage) {
                imageBase64 = await toBase64(imageUpload.files[0]);
                imageUpload.value = '';
            }

            // Gửi tin nhắn đến backend
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: messageToSend, // message đã ghép entity
                        userMessage: userMessage, // message gốc
                        image: imageBase64,
                        sessionId: currentSessionId // Gửi sessionId hiện tại (nếu có)
                    }),
                });

                const data = await response.json();
                console.log('Entity nhận về từ server:', data.entity);
                console.log('Bot response nhận về:', data.response);
                if (data.entity) {
                    setCurrentTopic(data.entity);
                }
                currentSessionId = data.sessionId; // Cập nhật sessionId

                // Luôn hiển thị phản hồi bot, kể cả khi response là chuỗi ngắn
                const botBubble = document.createElement('div');
                botBubble.classList.add('bot-message');
                botBubble.innerHTML = renderStructuredResponse(data.response || '');
                chatHistory.appendChild(botBubble);
                scrollToBottom();
            } catch (error) {
                console.error('Lỗi khi gửi tin nhắn:', error);
            }
        }
    }

    window.renderStructuredResponse = function(response) {
        // 1. Tìm phần text trước mục lớn (nếu có)
        const firstSectionMatch = response.match(/^(.*?)(?=\d+\..*?:)/s);
        let html = '';
        let rest = response;

        if (firstSectionMatch && firstSectionMatch[1].trim()) {
            html += `<div style="margin-bottom: 12px;">${firstSectionMatch[1].replace(/\n/g, '<br>')}</div>`;
            rest = response.slice(firstSectionMatch[1].length);
        }

        // 2. Xử lý mục lớn kiểu 1. 2. 3.
        const sectionRegex = /(\d+\..*?:)([\s\S]*?)(?=\n\d+\.|$)/g;
        let match;
        let foundSection = false;

        while ((match = sectionRegex.exec(rest)) !== null) {
            foundSection = true;
            const sectionTitle = match[1].trim();
            const sectionContent = match[2].trim();
            const lines = sectionContent.split('\n').map(line => line.trim()).filter(line => line);

            html += `<div style="margin-bottom: 16px;"><strong>${sectionTitle}</strong>`;
            if (lines.length > 0) {
                html += '<ul style="padding-left: 24px;">';
                lines.forEach(line => {
                    if (line.includes(':')) {
                        const [subTitle, ...rest] = line.split(':');
                        html += `<li><strong>${subTitle.trim()}:</strong> ${rest.join(':').trim()}</li>`;
                    } else {
                        html += `<li>${line}</li>`;
                    }
                });
                html += '</ul>';
            }
            html += '</div>';
        }

        // 3. Nếu không có mục lớn, kiểm tra nếu có nhiều dòng kiểu Tiêu đề: Nội dung
        const colonMatches = response.match(/.+?:/g);
        if (!foundSection && colonMatches && colonMatches.length >= 2) {
            const items = response.split('\n\n').filter(Boolean);
            html = '<ul style="padding-left: 24px;">';
            items.forEach(item => {
                const [title, ...rest] = item.split(':');
                const content = rest.join(':').trim();
                html += `<li><strong>${title.trim()}:</strong> ${content}</li>`;
            });
            html += '</ul>';
        }

        // 4. Nếu không match gì, fallback về cách cũ
        if (!html) {
            html = response.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        }
        return html;
    }

    // Hàm chuyển file sang base64
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});