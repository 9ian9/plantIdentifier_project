import { clearImagePreview, setupImageHandlers } from './imageHandler.js';
import { setupSpeechRecognition } from './speechRecognition.js';
import { setupMessageHandlers } from './messageHandler.js';
import { refreshChatSessions, getCurrentSessionId, setCurrentSessionId } from './chatSession.js';

document.addEventListener('DOMContentLoaded', () => {
    const chatSessionsList = document.getElementById('chatSessionsList');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistory = document.getElementById('chatHistory');
    const welcomeArea = document.getElementById('welcomeArea');
    const messageInput = document.getElementById('messageInput');
    const askQuestionBtn = document.getElementById('askQuestionBtn');
    const micBtn = document.getElementById('micBtn');
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const imageUpload = document.getElementById('image-upload');
    const sendBtn = document.querySelector('.send-btn');
    let chatStarted = false;

    // Load nội dung chat khi click vào một phiên
    chatSessionsList.addEventListener('click', async(e) => {
        const sessionItem = e.target.closest('.chat-session');
        if (!sessionItem) return;

        const sessionId = sessionItem.dataset.sessionId;

        try {
            const response = await fetch(`/chat/history/session/${sessionId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const sessionData = await response.json();

            // Hiển thị nội dung chat
            chatHistory.innerHTML = '';
            welcomeArea.style.display = 'none';

            sessionData.messages.forEach(msg => {
                const bubble = document.createElement('div');
                bubble.classList.add(msg.role === 'user' ? 'user-message' : 'bot-message');

                // Nếu có ảnh thì render ảnh trước
                if (msg.image) {
                    const imgElement = document.createElement('img');
                    imgElement.src = msg.image;
                    imgElement.alt = "Uploaded plant image";
                    imgElement.style.maxWidth = '100%';
                    imgElement.style.maxHeight = '200px';
                    imgElement.style.borderRadius = '8px';
                    bubble.appendChild(imgElement);
                }

                // Render text
                if (msg.content) {
                    if (msg.role === 'assistant') {
                        const textDiv = document.createElement('div');
                        textDiv.innerHTML = renderStructuredResponse(msg.content);
                        bubble.appendChild(textDiv);
                    } else {
                        const textDiv = document.createElement('div');
                        textDiv.textContent = msg.content;
                        bubble.appendChild(textDiv);
                    }
                }

                chatHistory.appendChild(bubble);
            });

            scrollToBottom();
        } catch (error) {
            console.error('Error loading chat session:', error);
        }
    });

    // Tạo chat mới
    newChatBtn.addEventListener('click', () => {
        setCurrentSessionId(null);
        chatHistory.innerHTML = '';
        welcomeArea.style.display = 'flex';
        messageInput.value = '';
        window.location.reload();
    });

    // Focus vào input khi click nút hỏi
    askQuestionBtn.addEventListener('click', () => {
        messageInput.focus();
    });

    // Xử lý gửi tin nhắn (cả text và ảnh)
    if (sendBtn) {
        sendBtn.addEventListener('click', async function() {
            const hasImage = imageUpload.files && imageUpload.files.length > 0;
            const userMessage = messageInput.value.trim();

            if (!userMessage && !hasImage) return;

            let messageToSend = userMessage;
            const currentTopic = getCurrentTopic();
            const PLANT_ENTITIES = [
                'đậu phộng', 'vải', 'dưa hấu', 'bơ', 'táo', 'cà phê', 'keo', 'mít', 'đu đủ',
                'dưa leo', 'xoài', 'chuối', 'mận', 'dừa', 'cà chua', 'nha đam', 'trà', 'sắn',
                'mãng cầu', 'ớt', 'tiêu', 'lúa'
            ];
            const containsAnyEntity = PLANT_ENTITIES.some(entity =>
                userMessage.toLowerCase().includes(entity)
            );
            if (currentTopic && !containsAnyEntity) {
                messageToSend = userMessage + ' ' + currentTopic;
            }

            if (!chatStarted) {
                welcomeArea.style.display = 'none';
                chatStarted = true;
            }

            // Hiển thị tin nhắn text nếu có
            if (userMessage) {
                const userBubble = document.createElement('div');
                userBubble.classList.add('user-message');
                userBubble.textContent = userMessage;
                chatHistory.appendChild(userBubble);
            }

            // Hiển thị preview ảnh nếu có
            if (hasImage) {
                const userBubble = document.createElement('div');
                userBubble.classList.add('user-message');
                const img = document.createElement('img');
                img.src = URL.createObjectURL(imageUpload.files[0]);
                img.style.maxWidth = '200px';
                userBubble.appendChild(img);
                chatHistory.appendChild(userBubble);
            }

            scrollToBottom();
            messageInput.value = '';

            try {
                let response;
                if (hasImage) {
                    // 1. Gửi ảnh lên trước
                    const formData = new FormData();
                    formData.append('plantImage', imageUpload.files[0]);
                    if (userMessage) formData.append('message', messageToSend); // vẫn gửi để lưu lịch sử
                    if (getCurrentSessionId()) formData.append('sessionId', getCurrentSessionId());

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadRes.json();

                    // Lưu entity vừa nhận diện được
                    const entity = uploadData.data && uploadData.data.entity ? uploadData.data.entity : undefined;
                    if (entity) setCurrentTopic(entity);

                    // Cập nhật session ID nếu là session mới
                    if (uploadData.data && uploadData.data.sessionId) {
                        setCurrentSessionId(uploadData.data.sessionId);
                    }

                    // Hiển thị phản hồi bot cho ảnh
                    const botBubble = document.createElement('div');
                    botBubble.classList.add('bot-message');
                    botBubble.innerHTML = renderStructuredResponse((uploadData.data && uploadData.data.botResponse) || '');
                    chatHistory.appendChild(botBubble);
                    scrollToBottom();

                    // Xoá preview và reset input nếu có ảnh
                    clearImagePreview();

                    // Nếu có text, gửi tiếp câu hỏi text kèm entity vừa nhận diện
                    if (userMessage) {
                        let textToSend = userMessage;
                        if (entity && !userMessage.toLowerCase().includes(entity.toLowerCase())) {
                            textToSend = userMessage + ' ' + entity;
                        }
                        console.log('Gửi message phụ sau upload ảnh:', textToSend, getCurrentSessionId());
                        const textRes = await fetch('/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: textToSend,
                                userMessage: userMessage,
                                sessionId: getCurrentSessionId()
                            }),
                        });
                        const textData = await textRes.json();
                        console.log('Bot trả lời cho message phụ:', textData.response);
                        // Lưu entity nếu có
                        if (textData.entity) setCurrentTopic(textData.entity);
                        // Hiển thị phản hồi bot cho text
                        const botBubble2 = document.createElement('div');
                        botBubble2.classList.add('bot-message');
                        botBubble2.innerHTML = renderStructuredResponse(textData.response || '');
                        chatHistory.appendChild(botBubble2);
                        scrollToBottom();
                        // Cập nhật sessionId nếu có
                        if (textData.sessionId) setCurrentSessionId(textData.sessionId);
                    }

                    // Refresh chat sessions
                    await refreshChatSessions();
                } else {
                    // Gửi tin nhắn text
                    response = await fetch('/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: messageToSend,
                            userMessage: userMessage,
                            sessionId: getCurrentSessionId()
                        }),
                    });

                    const data = await response.json();

                    if (data.status === 'success' || data.response) {
                        // Cập nhật entity nếu có
                        if (data.entity || (data.data && data.data.entity)) {
                            setCurrentTopic(data.entity || data.data.entity);
                        }

                        // Cập nhật session ID nếu là session mới
                        if (data.sessionId || (data.data && data.data.sessionId)) {
                            setCurrentSessionId(data.sessionId || data.data.sessionId);
                        }

                        // Hiển thị phản hồi bot
                        const botBubble = document.createElement('div');
                        botBubble.classList.add('bot-message');
                        botBubble.innerHTML = renderStructuredResponse(data.response || data.data.botResponse || '');
                        chatHistory.appendChild(botBubble);
                        scrollToBottom();

                        // Refresh chat sessions
                        await refreshChatSessions();
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });
    }

    // Hàm lưu và lấy topic từ localStorage
    function setCurrentTopic(topic) {
        localStorage.setItem('currentTopic', topic);
    }

    function getCurrentTopic() {
        return localStorage.getItem('currentTopic') || '';
    }


    if (sidebar && toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
        });
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }


    // Initialize all handlers
    setupImageHandlers();
    setupSpeechRecognition();
    setupMessageHandlers();

    // Load initial chat sessions
    refreshChatSessions();
});