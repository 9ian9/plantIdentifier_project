import { chatSessionsList, chatHistory, welcomeArea, scrollToBottom, renderStructuredResponse } from './chatUI.js';

let currentSessionId = null;
let chatStarted = false;

function setCurrentSessionId(id) {
    currentSessionId = id;
}

function getCurrentSessionId() {
    return currentSessionId;
}

// Session Management Functions
function setCurrentTopic(topic) {
    localStorage.setItem('currentTopic', topic);
}

function getCurrentTopic() {
    return localStorage.getItem('currentTopic') || '';
}

function setChatStarted(value) {
    chatStarted = value;
}

async function refreshChatSessions() {
    try {
        const response = await fetch('/chat/history/sessions');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const sessions = await response.json();
        chatSessionsList.innerHTML = '';

        if (sessions.length > 0) {
            sessions.forEach(session => {
                const li = document.createElement('li');
                li.className = 'chat-session';
                if (session.sessionId === currentSessionId) {
                    li.classList.add('active-chat-session');
                }
                li.dataset.sessionId = session.sessionId;

                li.innerHTML = `
                    <div class="session-title">
                        <span class="title-text">${session.title || 'New Chat'}</span>
                        <input type="text" class="title-edit" value="${session.title || 'New Chat'}" style="display: none;">
                    </div>
                    <div class="session-preview">
                        ${(session.messages[0]?.content || '').substring(0, 20)}${(session.messages[0]?.content?.length > 20 ? '...' : '')}
                    </div>
                    <div class="session-date">
                        ${new Date(session.updatedAt).toLocaleString()}
                    </div>
                    <button class="delete-session-btn" title="Delete chat">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;

                setupSessionDelete(li);
                chatSessionsList.appendChild(li);
            });
        } else {
            chatSessionsList.innerHTML = '<li class="no-sessions">No recent chats</li>';
        }

        setTimeout(setupSessionTitleEditing, 0);
    } catch (error) {
        console.error('Error refreshing chat sessions:', error);
    }
}

function setupSessionDelete(sessionElement) {
    const deleteBtn = sessionElement.querySelector('.delete-session-btn');
    deleteBtn.addEventListener('click', async(e) => {
        e.stopPropagation();
        const sessionId = sessionElement.dataset.sessionId;
        if (confirm('Are you sure you want to delete this chat?')) {
            try {
                const res = await fetch(`/chat/history/session/${sessionId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    // Nếu session hiện tại bị xóa, reset UI
                    if (currentSessionId === sessionId) {
                        currentSessionId = null;
                        chatHistory.innerHTML = '';
                        welcomeArea.style.display = 'flex';
                    }

                    // Thay vì chỉ remove phần tử DOM, gọi lại toàn bộ danh sách
                    await refreshChatSessions();
                } else {
                    console.error('Failed to delete session');
                }
            } catch (error) {
                console.error('Error deleting session:', error);
            }
        }
    });
}


function setupSessionTitleEditing() {
    const titleElements = document.querySelectorAll('.session-title');

    titleElements.forEach(titleElement => {
        const textElement = titleElement.querySelector('.title-text');
        const inputElement = titleElement.querySelector('.title-edit');
        const sessionItem = titleElement.closest('.chat-session');

        if (!textElement || !inputElement || !sessionItem) {
            console.warn('Missing required elements for session title editing');
            return;
        }

        const sessionId = sessionItem.dataset.sessionId;

        titleElement.addEventListener('dblclick', () => {
            textElement.style.display = 'none';
            inputElement.style.display = 'block';
            inputElement.focus();
            inputElement.select();
        });

        inputElement.addEventListener('keyup', async(e) => {
            if (e.key === 'Enter') {
                await saveTitleChange();
            }
        });

        inputElement.addEventListener('blur', saveTitleChange);

        // Prevent event bubbling
        ['click', 'mousedown', 'mouseup', 'keydown'].forEach(event => {
            inputElement.addEventListener(event, (e) => e.stopPropagation());
        });

        async function saveTitleChange() {
            const newTitle = inputElement.value.trim();
            if (newTitle && newTitle !== textElement.textContent) {
                try {
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

            inputElement.style.display = 'none';
            textElement.style.display = 'inline';
        }
    });
}

export {
    currentSessionId,
    chatStarted,
    setCurrentSessionId,
    getCurrentSessionId,
    setCurrentTopic,
    getCurrentTopic,
    refreshChatSessions,
    setChatStarted
};