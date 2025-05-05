const nlpService = require('./nlpService');
const intents = require('../models/intents');
const { RESPONSES } = require('../config/constants');
const logger = require('../utils/logger');

class ChatService {
    processMessage(userMessage) {
        try {
            console.log('Received message:', userMessage);

            const intentResult = nlpService.findBestIntent(userMessage);
            console.log('Intent result:', intentResult);

            if (!intentResult) {
                return RESPONSES.UNKNOWN;
            }

            const intent = intents[intentResult.intent];
            console.log('Matched intent:', intent); // DEBUG thêm

            if (!intent) {
                console.error('Intent not found:', intentResult.intent);
                return RESPONSES.UNKNOWN;
            }

            // Xử lý intent chào hỏi
            if (intentResult.intent === 'chao_hoi') {
                if (!intent.responses || !Array.isArray(intent.responses) || intent.responses.length === 0) {
                    console.error('Responses for chao_hoi intent are missing or invalid:', intent);
                    return RESPONSES.UNKNOWN;
                }
                return intent.responses[Math.floor(Math.random() * intent.responses.length)];
            }

            // Xử lý các intent khác có responses là mảng
            if (intent.responses && Array.isArray(intent.responses)) {
                return intent.responses[Math.floor(Math.random() * intent.responses.length)];
            }

            // Xử lý các intent có responses là object (dựa trên entity)
            if (intent.responses && typeof intent.responses === 'object' && intentResult.entity) {
                const response = intent.responses[intentResult.entity];
                if (response) {
                    return response;
                }
            }

            return RESPONSES.UNKNOWN;

        } catch (error) {
            console.error('Chat error:', error);
            return RESPONSES.ERROR;
        }
    }

    generateResponse(intentConfig, entities) {
        // Logic này có vẻ không còn cần thiết với cách xử lý mới trong processMessage
        // Bạn có thể cân nhắc loại bỏ hoặc điều chỉnh nếu vẫn cần.
        if (entities.length > 0 && typeof intentConfig.responses === 'object') {
            for (const entity of entities) {
                if (intentConfig.responses[entity]) {
                    return intentConfig.responses[entity];
                }
            }
        }

        if (Array.isArray(intentConfig.responses)) {
            return intentConfig.responses[
                Math.floor(Math.random() * intentConfig.responses.length)
            ];
        }

        return null;
    }
}

module.exports = new ChatService();