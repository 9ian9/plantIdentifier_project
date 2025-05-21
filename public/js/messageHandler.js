// import { chatHistory, messageInput, welcomeArea, scrollToBottom, renderStructuredResponse } from './chatUI.js';
// import { currentSessionId, chatStarted, setCurrentTopic, getCurrentTopic, refreshChatSessions, setChatStarted, setCurrentSessionId, getCurrentSessionId } from './chatSession.js';
// import { imageUpload, previewImg, previewContainer, uploadImage, hasImage, getImageFile, clearImagePreview } from './imageHandler.js';

// const sendBtn = document.querySelector('.send-btn');

// const PLANT_ENTITIES = [
//     'đậu phộng', 'vải', 'dưa hấu', 'bơ', 'táo', 'cà phê', 'keo', 'mít', 'đu đủ',
//     'dưa leo', 'xoài', 'chuối', 'mận', 'dừa', 'cà chua', 'nha đam', 'trà', 'sắn',
//     'mãng cầu', 'ớt', 'tiêu', 'lúa'
// ];

// // Add event listener for Enter key
// messageInput.addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//         e.preventDefault();
//         if (sendBtn) sendBtn.click();
//     }
// });

// async function sendMessage() {
//     const hasImageFile = hasImage();
//     const userMessage = messageInput.value.trim();

//     if (!userMessage && !hasImageFile) return;

//     let messageToSend = userMessage;
//     const currentTopic = getCurrentTopic();
//     const containsAnyEntity = PLANT_ENTITIES.some(entity =>
//         userMessage.toLowerCase().includes(entity)
//     );
//     if (currentTopic && !containsAnyEntity) {
//         messageToSend = userMessage + ' ' + currentTopic;
//     }

//     if (!chatStarted) {
//         welcomeArea.style.display = 'none';
//         setChatStarted(true);
//     }

//     // Display user message
//     if (userMessage) {
//         const userBubble = document.createElement('div');
//         userBubble.classList.add('user-message');
//         userBubble.textContent = userMessage;
//         chatHistory.appendChild(userBubble);
//     }

//     // Display image preview if exists
//     // ĐÃ XOÁ ĐỂ TRÁNH DOUBLE IMAGE
//     if (hasImageFile) {
//         const userBubble = document.createElement('div');
//         userBubble.classList.add('user-message');
//         const img = document.createElement('img');
//         img.src = URL.createObjectURL(getImageFile());
//         img.style.maxWidth = '200px';
//         userBubble.appendChild(img);
//         chatHistory.appendChild(userBubble);
//     }

//     scrollToBottom();
//     messageInput.value = '';

//     try {
//         if (hasImageFile) {
//             await handleImageMessage(userMessage);
//         } else {
//             await handleTextMessage(userMessage, messageToSend);
//         }
//     } catch (error) {
//         console.error('Error sending message:', error);
//     }
// }

// async function handleImageMessage(userMessage) {
//     const uploadData = await uploadImage(getImageFile(), userMessage, getCurrentSessionId());

//     // Save detected entity
//     const entity = uploadData.data && uploadData.data.entity;
//     if (entity) setCurrentTopic(entity);

//     // Update session ID if new
//     if (uploadData.data && uploadData.data.sessionId) {
//         setCurrentSessionId(uploadData.data.sessionId);
//     }

//     // Display bot response for image
//     const botBubble = document.createElement('div');
//     botBubble.classList.add('bot-message');
//     const formattedResponse = formatBotResponse(uploadData.data && uploadData.data.botResponse);
//     botBubble.innerHTML = formattedResponse;
//     chatHistory.appendChild(botBubble);
//     scrollToBottom();

//     // Clear preview and reset input
//     clearImagePreview();

//     // ĐÃ XOÁ KHÔNG GỬI MESSAGE PHỤ NỮA
//     // If there's text, send follow-up question with detected entity
//     // if (userMessage) {
//     //     let textToSend = userMessage;
//     //     if (entity && !userMessage.toLowerCase().includes(entity.toLowerCase())) {
//     //         textToSend = userMessage + ' ' + entity;
//     //     }
//     //     await handleTextMessage(userMessage, textToSend);
//     // }

//     await refreshChatSessions();
// }

// async function handleTextMessage(userMessage, messageToSend) {
//     const response = await fetch('/chat', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             message: messageToSend,
//             userMessage: userMessage,
//             sessionId: getCurrentSessionId()
//         }),
//     });

//     const data = await response.json();

//     if (data.status === 'success' || data.response) {
//         // Update entity if exists
//         if (data.entity || (data.data && data.data.entity)) {
//             setCurrentTopic(data.entity || data.data.entity);
//         }

//         // Update session ID if new
//         if (data.sessionId || (data.data && data.data.sessionId)) {
//             setCurrentSessionId(data.sessionId || data.data.sessionId);
//         }

//         // Display bot response
//         const botBubble = document.createElement('div');
//         botBubble.classList.add('bot-message');
//         const formattedResponse = formatBotResponse(data.response || data.data.botResponse);
//         botBubble.innerHTML = formattedResponse;
//         chatHistory.appendChild(botBubble);
//         scrollToBottom();

//         await refreshChatSessions();
//     }
// }

// function formatBotResponse(response) {
//     if (!response) return '';

//     // Replace newlines with <br>
//     let formatted = response.replace(/\n/g, '<br>');

//     // Format bullet points
//     formatted = formatted.replace(/•\s*(.*?)(?=<br>|$)/g, '<li>$1</li>');
//     formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

//     // Format numbered lists
//     formatted = formatted.replace(/(\d+\.\s*.*?)(?=<br>|$)/g, '<li>$1</li>');
//     formatted = formatted.replace(/(<li>\d+\..*?<\/li>)+/g, '<ol>$&</ol>');

//     return formatted;
// }

// function setupMessageHandlers() {
//     if (sendBtn) {
//         sendBtn.addEventListener('click', sendMessage);
//     }
// }

// export { setupMessageHandlers };