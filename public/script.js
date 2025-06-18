document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.querySelector('.chat-history');
    const chatSessionsList = document.getElementById('chatSessionsList');

    // Hàm làm mới danh sách lịch sử chat
    async function refreshChatSessions() {
        try {
            const response = await fetch('/chat/history/sessions');
            if (!response.ok) throw new Error('Network response was not ok');
            const sessions = await response.json();
            if (!chatSessionsList) return;

            chatSessionsList.innerHTML = '';

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
                chatSessionsList.innerHTML = '<li class="no-sessions">Chưa có lịch sử trò chuyện</li>';
            }
        } catch (error) {
            console.error('Error refreshing chat sessions:', error);
        }
    }


    // Hàm format nội dung bot trả về
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

    // Khởi động: load lịch sử chat
    refreshChatSessions();
});