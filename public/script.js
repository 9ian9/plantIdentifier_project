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
    attachButton.addEventListener('click', () => imageUpload.click());
    inputArea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = inputArea.value.trim();
        const hasImage = imageUpload.files && imageUpload.files.length > 0;

        if (message || hasImage) {
            if (!chatStarted) {
                welcomeArea.style.display = 'none';
                chatStarted = true;
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
                const imageFile = imageUpload.files[0];
                const imageUrl = URL.createObjectURL(imageFile);

                const imageBubble = document.createElement('div');
                imageBubble.classList.add('user-message', 'image-message');

                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.alt = "Uploaded plant image";
                imgElement.style.maxWidth = '100%';
                imgElement.style.maxHeight = '200px';
                imgElement.style.borderRadius = '8px';

                imageBubble.appendChild(imgElement);
                chatHistory.appendChild(imageBubble);
            }

            scrollToBottom();
            inputArea.value = '';

            // Chuyển ảnh sang base64 nếu có
            let imageBase64 = '';
            if (hasImage) {
                imageBase64 = await toBase64(imageUpload.files[0]);
                imageUpload.value = ''; // Reset input file
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
                        image: imageBase64
                    }),
                });

                const data = await response.json();

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