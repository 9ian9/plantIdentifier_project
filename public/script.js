document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.querySelector('.input-area input[type="text"]');
    const sendButton = document.querySelector('.input-area .send-btn');
    const attachButton = document.querySelector('.input-area .attach-btn');
    const mainContent = document.querySelector('.main-content');
    const chatHistory = document.querySelector('.chat-history');
    const welcomeArea = document.querySelector('.welcome-area');
    const imageUpload = document.getElementById('image-upload');
    let chatStarted = false;
    let currentSessionId = null;

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

    // Thêm hàm refreshChatSessions
    async function refreshChatSessions() {
        try {
            const response = await fetch('/chat/history/sessions');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const sessions = await response.json();
            const chatSessionsList = document.getElementById('chatSessionsList');
            if (!chatSessionsList) return;

            chatSessionsList.innerHTML = ''; // Xóa các session cũ

            if (sessions.length > 0) {
                sessions.forEach(session => {
                    const li = document.createElement('li');
                    li.className = 'chat-session';
                    li.dataset.sessionId = session.sessionId;

                    li.innerHTML = `
                        <div class="session-title">
                            <span class="title-text">${session.title || 'New Chat'}</span>
                            <input type="text" class="title-edit" value="${session.title || 'New Chat'}" style="display: none;">
                        </div>
                        <div class="session-preview">
                            ${(session.messages[0]?.content || '').substring(0, 30)}${(session.messages[0]?.content?.length > 30 ? '...' : '')}
                        </div>
                        <div class="session-date">
                            ${new Date(session.updatedAt).toLocaleString()}
                        </div>
                        <button class="delete-session-btn" title="Delete chat">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    `;

                    chatSessionsList.appendChild(li);
                });
            } else {
                chatSessionsList.innerHTML = '<li class="no-sessions">No recent chats</li>';
            }
        } catch (error) {
            console.error('Error refreshing chat sessions:', error);
        }
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
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
});