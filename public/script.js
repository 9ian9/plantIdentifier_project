document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.querySelector('.input-area input');
    const sendButton = document.querySelector('.input-area .send-btn');
    const mainContent = document.querySelector('.main-content');
    const chatHistory = document.querySelector('.chat-history');
    const welcomeArea = document.querySelector('.welcome-area');
    let chatStarted = false;

    sendButton.addEventListener('click', sendMessage);
    inputArea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = inputArea.value.trim();
        if (message) {
            if (!chatStarted) {
                welcomeArea.style.display = 'none';
                chatStarted = true;
            }

            // Hiển thị tin nhắn của người dùng
            const userBubble = document.createElement('div');
            userBubble.classList.add('user-message');
            userBubble.textContent = message;
            chatHistory.appendChild(userBubble);
            scrollToBottom();

            inputArea.value = '';

            // Gửi tin nhắn đến backend
            fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message }),
                })
                .then(response => response.json())
                .then(data => {
                    // Hiển thị phản hồi của bot
                    const botBubble = document.createElement('div');
                    botBubble.classList.add('bot-message');
                    botBubble.textContent = data.response;
                    chatHistory.appendChild(botBubble);
                    scrollToBottom();
                })
                .catch(error => {
                    console.error('Lỗi khi gửi tin nhắn:', error);
                });
        }
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});