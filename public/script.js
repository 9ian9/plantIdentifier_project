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
        const firstSectionMatch = response.match(/^(.*?)(?=\n?I\.\s|\n?\d+\.\s.*?:)/s);
        let html = '';
        let rest = response;

        if (firstSectionMatch && firstSectionMatch[1].trim()) {
            html += `<div style="margin-bottom: 12px;">${firstSectionMatch[1].replace(/\n/g, '<br>')}</div>`;
            rest = response.slice(firstSectionMatch[1].length);
        }

        // 2. Kiểm tra có mục cha kiểu I., II., ... không
        const hasRomanSection = /^\s*I\.\s/m.test(rest);
        if (hasRomanSection) {
            // Tách các mục cha kiểu I., II., ...
            const romanSectionRegex = /(\b[A-Z]+\.)\s*(.*?)(?=\n\b[A-Z]+\.|$)/gs;
            let match;
            while ((match = romanSectionRegex.exec(rest)) !== null) {
                const romanNum = match[1];
                const romanTitle = match[2].split('\n')[0].trim();
                let romanContent = match[2].slice(romanTitle.length).trim();
                // Tìm các mục con kiểu 1., 2., ... hoặc a., b., ...
                let subHtml = '';
                const subSectionRegex = /(\d+\.|[a-z]\.)\s*(.*?)(?=\n\d+\.|\n[a-z]\.|$)/gs;
                let subMatch;
                let foundSub = false;
                while ((subMatch = subSectionRegex.exec(romanContent)) !== null) {
                    foundSub = true;
                    const subNum = subMatch[1];
                    const subTitle = subMatch[2].trim();
                    // Nếu có dấu hai chấm, tách tiêu đề và nội dung
                    if (subTitle.includes(':')) {
                        const [title, ...restContent] = subTitle.split(':');
                        const content = restContent.join(':').trim();
                        subHtml += `<li><strong>${subNum} ${title.trim()}:</strong> ${content}</li>`;
                    } else {
                        subHtml += `<li><strong>${subNum} ${subTitle}</strong></li>`;
                    }
                }
                if (foundSub) {
                    html += `<div style="font-weight:bold; margin-top:12px;">${romanNum} ${romanTitle}</div><ul style="padding-left:24px;">${subHtml}</ul>`;
                } else {
                    html += `<div style="font-weight:bold; margin-top:12px;">${romanNum} ${romanTitle}</div><div style="padding-left:24px;">${romanContent.replace(/\n/g, '<br>')}</div>`;
                }
            }
        } else {
            // Xử lý mục lớn kiểu 1., 2., 3. (giữ dấu chấm, không bullet)
            const sectionRegex = /(\d+\.)\s*(.*?:)([\s\S]*?)(?=\n\d+\.\s.*?:|$)/g;
            let match;
            let foundSection = false;
            while ((match = sectionRegex.exec(rest)) !== null) {
                foundSection = true;
                const sectionNumber = match[1];
                const sectionTitle = match[2].replace(/^\d+\.\s*/, '').trim();
                const sectionContent = match[3].trim();
                const lines = sectionContent.split('\n').map(line => line.trim()).filter(line => line);
                html += `<div style="margin-bottom: 16px;"><strong>${sectionNumber} ${sectionTitle}</strong>`;
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
            // Nếu không có mục lớn, kiểm tra nếu có nhiều dòng kiểu Tiêu đề: Nội dung
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
        }
        // Fallback nếu không match gì
        if (!html) {
            html = response.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        }
        return html;
    }

    // Khởi động: load lịch sử chat
    refreshChatSessions();
});