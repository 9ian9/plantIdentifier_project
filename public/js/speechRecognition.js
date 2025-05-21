import { micBtn, messageInput } from './chatUI.js';

function setupSpeechRecognition() {
    if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
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
}

export { setupSpeechRecognition };