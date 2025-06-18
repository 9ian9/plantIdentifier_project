// UI Elements
const chatSessionsList = document.getElementById('chatSessionsList');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const welcomeArea = document.getElementById('welcomeArea');
const messageInput = document.getElementById('messageInput');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const askQuestionBtn = document.getElementById('askQuestionBtn');
const micBtn = document.getElementById('micBtn');
const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');

// UI Functions
function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderStructuredResponse(content) {
    return content;
}

// Event Listeners
if (sidebar && toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });
}

askQuestionBtn.addEventListener('click', () => {
    messageInput.focus();
});

export {
    chatSessionsList,
    newChatBtn,
    chatHistory,
    welcomeArea,
    messageInput,
    uploadPhotoBtn,
    askQuestionBtn,
    micBtn,
    sidebar,
    toggleSidebarBtn,
    scrollToBottom,
    renderStructuredResponse
};