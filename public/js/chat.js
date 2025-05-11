document.addEventListener('DOMContentLoaded', () => {
    const chatSessionsList = document.getElementById('chatSessionsList');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistory = document.getElementById('chatHistory');
    const welcomeArea = document.getElementById('welcomeArea');
    const messageInput = document.getElementById('messageInput');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const askQuestionBtn = document.getElementById('askQuestionBtn');
    const micBtn = document.getElementById('micBtn');
    let currentSessionId = null;

    // Load nội dung chat khi click vào một phiên
    chatSessionsList.addEventListener('click', async(e) => {
        const sessionItem = e.target.closest('.chat-session');
        if (!sessionItem) return;

        const sessionId = sessionItem.dataset.sessionId;
        currentSessionId = sessionId;

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

                if (msg.image) {
                    const imgElement = document.createElement('img');
                    imgElement.src = msg.image;
                    imgElement.alt = "Uploaded plant image";
                    imgElement.style.maxWidth = '100%';
                    imgElement.style.maxHeight = '200px';
                    imgElement.style.borderRadius = '8px';
                    bubble.appendChild(imgElement);
                }

                if (msg.content) {
                    const textNode = document.createTextNode(msg.content);
                    bubble.appendChild(textNode);
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
        currentSessionId = null;
        chatHistory.innerHTML = '';
        welcomeArea.style.display = 'flex';
        messageInput.value = '';
    });

    // Focus vào input khi click nút hỏi
    askQuestionBtn.addEventListener('click', () => {
        messageInput.focus();
    });

    // Mở dialog upload ảnh
    // uploadPhotoBtn.addEventListener('click', () => {
    //     document.getElementById('image-upload').click();
    // });

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Thêm hàm xử lý double click
    function setupSessionTitleEditing() {
        const titleElements = document.querySelectorAll('.session-title');

        titleElements.forEach(titleElement => {
            // Kiểm tra sự tồn tại của các phần tử con
            const textElement = titleElement.querySelector('.title-text');
            const inputElement = titleElement.querySelector('.title-edit');
            const sessionItem = titleElement.closest('.chat-session');

            if (!textElement || !inputElement || !sessionItem) {
                console.warn('Missing required elements for session title editing');
                return;
            }

            const sessionId = sessionItem.dataset.sessionId;

            // Double click để chỉnh sửa
            titleElement.addEventListener('dblclick', () => {
                textElement.style.display = 'none';
                inputElement.style.display = 'block';
                inputElement.focus();
                inputElement.select();
            });

            // Xử lý khi nhấn Enter hoặc blur
            inputElement.addEventListener('keyup', async(e) => {
                if (e.key === 'Enter') {
                    await saveTitleChange();
                }
            });

            inputElement.addEventListener('blur', saveTitleChange);

            // Ngăn sự kiện click lan ra ngoài khi focus vào input rename
            inputElement.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            inputElement.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            inputElement.addEventListener('mouseup', (e) => {
                e.stopPropagation();
            });
            inputElement.addEventListener('keydown', (e) => {
                e.stopPropagation();
            });

            async function saveTitleChange() {
                const newTitle = inputElement.value.trim();
                if (newTitle && newTitle !== textElement.textContent) {
                    try {
                        // Gọi API cập nhật title
                        const response = await fetch(`/chat/history/session/${sessionId}/title`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                title: newTitle
                            })
                        });

                        if (response.ok) {
                            textElement.textContent = newTitle;
                            // KHÔNG gọi refreshChatSessions ở đây để tránh mất phông chat
                        } else {
                            console.error('Failed to update title');
                        }
                    } catch (error) {
                        console.error('Error updating title:', error);
                    }
                }

                // Ẩn input, hiện text
                inputElement.style.display = 'none';
                textElement.style.display = 'inline';
            }
        });
    }

    // Cập nhật danh sách phiên chat mỗi khi có thay đổi
    async function refreshChatSessions() {
        try {
            const response = await fetch('/chat/history/sessions');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const sessions = await response.json();

            const chatSessionsList = document.getElementById('chatSessionsList');
            if (sessions.length > 0) {
                chatSessionsList.innerHTML = sessions.map(session => `
                    <li class="chat-session" data-session-id="${session.sessionId}">
                        <div class="session-title">
                            <div class="title-text">${session.title || 'New Chat'}</div>
                            <input type="text" class="title-edit" value="${session.title || 'New Chat'}" style="display: none;">
                            <button class="delete-session-btn" title="Delete chat">🗑️</button>
                        </div>
                        <div class="session-preview">
                            ${session.messages[0]?.content?.substring(0, 30) || ''}${session.messages[0]?.content?.length > 30 ? '...' : ''}
                        </div>
                        <div class="session-date">
                            ${new Date(session.updatedAt).toLocaleString()}
                        </div>
                    </li>
                `).join('');

                // Thêm event listener cho nút xóa
                document.querySelectorAll('.delete-session-btn').forEach(btn => {
                    btn.addEventListener('click', async(e) => {
                        e.stopPropagation(); // Ngăn chặn sự kiện click lan ra session
                        const sessionItem = btn.closest('.chat-session');
                        const sessionId = sessionItem.dataset.sessionId;

                        if (confirm('Are you sure you want to delete this chat?')) {
                            try {
                                const response = await fetch(`/chat/history/session/${sessionId}`, {
                                    method: 'DELETE'
                                });

                                if (response.ok) {
                                    sessionItem.remove();
                                    // Nếu đang xem session bị xóa, reset về màn hình chào
                                    if (currentSessionId === sessionId) {
                                        currentSessionId = null;
                                        chatHistory.innerHTML = '';
                                        welcomeArea.style.display = 'flex';
                                    }
                                } else {
                                    console.error('Failed to delete session');
                                }
                            } catch (error) {
                                console.error('Error deleting session:', error);
                            }
                        }
                    });
                });
            } else {
                chatSessionsList.innerHTML = '<li class="no-sessions">No recent chats</li>';
            }
            setTimeout(setupSessionTitleEditing, 0);
        } catch (error) {
            console.error('Error refreshing chat sessions:', error);
        }
    }

    // Gọi lần đầu khi trang load
    (async function init() {
        await refreshChatSessions();
    })();

    // Speech-to-text cho nút mic
    if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN'; // Đổi thành 'en-US' nếu muốn tiếng Anh
        recognition.continuous = false;
        recognition.interimResults = false;
        let recognizing = false;

        micBtn.addEventListener('click', () => {
            if (recognizing) {
                recognition.stop();
                micBtn.classList.remove('active');
                recognizing = false;
            } else {
                recognition.start();
                micBtn.classList.add('active');
                recognizing = true;
            }
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
            micBtn.classList.remove('active');
            recognizing = false;
        };

        recognition.onerror = (event) => {
            micBtn.classList.remove('active');
            recognizing = false;
            alert('Speech recognition error: ' + event.error);
        };

        recognition.onend = () => {
            micBtn.classList.remove('active');
            recognizing = false;
        };
    } else if (micBtn) {
        micBtn.disabled = true;
        micBtn.title = "Speech recognition not supported in this browser";
    }
});