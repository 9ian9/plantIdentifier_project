document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.querySelector('.input-area input[type="text"]');
    const sendButton = document.querySelector('.input-area .send-btn');
    const attachButton = document.querySelector('.input-area .attach-btn');
    const mainContent = document.querySelector('.main-content');
    const chatHistory = document.querySelector('.chat-history');
    const welcomeArea = document.querySelector('.welcome-area');
    const imageUpload = document.getElementById('image-upload');
    let chatStarted = false;

    sendButton.addEventListener('click', sendMessage);
    // attachButton.addEventListener('click', () => imageUpload.click());
    inputArea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    let currentSessionId = null;
    async function sendMessage() {
        const message = inputArea.value.trim();
        const hasImage = imageUpload.files && imageUpload.files.length > 0;

        if (message || hasImage) {
            if (!chatStarted) {
                welcomeArea.style.display = 'none';
                chatStarted = true;
                currentSessionId = null; // Reset session khi bắt đầu chat mới
            }

            // Hiển thị tin nhắn của người dùng
            if (message) {
                const userBubble = document.createElement('div');
                userBubble.classList.add('user-message');
                userBubble.textContent = message;
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
                        message: message,
                        image: imageBase64,
                        sessionId: currentSessionId // Gửi sessionId hiện tại (nếu có)
                    }),
                });

                const data = await response.json();
                currentSessionId = data.sessionId; // Cập nhật sessionId

                // Hiển thị phản hồi của bot
                const botBubble = document.createElement('div');
                botBubble.classList.add('bot-message');
                botBubble.textContent = data.response;
                chatHistory.appendChild(botBubble);
                scrollToBottom();
            } catch (error) {
                console.error('Lỗi khi gửi tin nhắn:', error);
            }
        }
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