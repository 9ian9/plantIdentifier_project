document.addEventListener('DOMContentLoaded', () => {
    const chatSessionsList = document.getElementById('chatSessionsList');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistory = document.getElementById('chatHistory');
    const welcomeArea = document.getElementById('welcomeArea');
    const messageInput = document.getElementById('messageInput');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const askQuestionBtn = document.getElementById('askQuestionBtn');
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
    uploadPhotoBtn.addEventListener('click', () => {
        document.getElementById('image-upload').click();
    });

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
                        </div>
                        <div class="session-preview">
                            ${session.messages[0]?.content?.substring(0, 30) || ''}${session.messages[0]?.content?.length > 30 ? '...' : ''}
                        </div>
                        <div class="session-date">
                            ${new Date(session.updatedAt).toLocaleString()}
                        </div>
                    </li>
                `).join('');
            } else {
                chatSessionsList.innerHTML = '<li class="no-sessions">No recent chats</li>';
            }
            setTimeout(setupSessionTitleEditing, 0); // Đảm bảo hàm này được gọi sau khi DOM đã được cập nhật
        } catch (error) {
            console.error('Error refreshing chat sessions:', error);
        }
    }

    // Gọi lần đầu khi trang load
    (async function init() {
        await refreshChatSessions();
    })();
});