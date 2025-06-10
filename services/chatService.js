const nlpService = require('./nlpService');
const intents = require('../models/intents');
const { RESPONSES } = require('../config/constants');
const logger = require('../utils/logger');

// Hàm tách mục nhỏ từ response (cải tiến)
function extractSection(response, keyword) {
    if (!keyword) return response;
    const lowerKeyword = keyword.toLowerCase().replace(/[^a-zA-Z0-9à-ỹ]/g, '');
    // Tách các dòng
    const lines = response.split(/\n|•|\*/).map(s => s.trim()).filter(Boolean);
    // Regex tìm mục nhỏ: bắt đầu bằng keyword (không phân biệt hoa thường), có thể có dấu hai chấm hoặc không
    const regex = new RegExp(`^(${lowerKeyword}|-?\s*${lowerKeyword})[:：]?`, 'i');
    for (const line of lines) {
        // Loại bỏ ký tự đặc biệt để so sánh
        const normalized = line.toLowerCase().replace(/[^a-zA-Z0-9à-ỹ]/g, '');
        if (normalized.startsWith(lowerKeyword) || regex.test(line)) {
            return line;
        }
    }
    // Nếu không tìm thấy, trả về toàn bộ
    return response;
}

class ChatService {
    processMessage(userMessage, rawUserMessage = null) {
        try {
            // Nếu có rawUserMessage (message gốc), dùng để tách mục nhỏ
            const keyword = rawUserMessage || '';
            // console.log('[DEBUG] userMessage:', userMessage, '| rawUserMessage:', rawUserMessage, '| keyword:', keyword);
            const intentResult = nlpService.findBestIntent(userMessage);

            if (!intentResult) {
                return { response: RESPONSES.UNKNOWN, entity: null };
            }

            const intent = intents[intentResult.intent];

            if (!intent) {
                return { response: RESPONSES.UNKNOWN, entity: null };
            }

            // Xử lý intent chào hỏi
            if (intentResult.intent === 'chao_hoi') {
                if (!intent.responses || !Array.isArray(intent.responses) || intent.responses.length === 0) {
                    return { response: RESPONSES.UNKNOWN, entity: null };
                }
                return {
                    response: intent.responses[Math.floor(Math.random() * intent.responses.length)],
                    entity: intentResult.entity || null
                };
            }

            // Xử lý intent cảm ơn
            if (intentResult.intent === 'cam_on') {
                if (!intent.responses || !Array.isArray(intent.responses) || intent.responses.length === 0) {
                    return { response: RESPONSES.UNKNOWN, entity: null };
                }
                return {
                    response: intent.responses[Math.floor(Math.random() * intent.responses.length)],
                    entity: intentResult.entity || null
                };
            }

            // Xử lý các intent khác có responses là mảng
            if (intent.responses && Array.isArray(intent.responses)) {
                return {
                    response: intent.responses[Math.floor(Math.random() * intent.responses.length)],
                    entity: intentResult.entity || null
                };
            }

            // Xử lý các intent có responses là object (dựa trên entity)
            let response = null;
            if (intent.responses && typeof intent.responses === 'object') {
                if (intentResult.entity && intent.responses[intentResult.entity]) {
                    response = intent.responses[intentResult.entity];
                } else {
                    // Nếu không có entity, lấy response mặc định
                    response = intent.responses.default || RESPONSES.UNKNOWN;
                }
            }

            // Nếu user hỏi về mục nhỏ (ví dụ: 'phân loại', 'thân', 'lá', ...), chỉ trả về đúng phần đó
            if (response && keyword) {
                // Nếu keyword là một trong các mục nhỏ, tách phần đó
                const smallSections = ['phân loại', 'thân', 'lá', 'rễ', 'quả', 'hoa', 'hạt', 'đặc điểm', 'sinh học', 'công dụng', 'phân bố', 'nguồn gốc'];
                const lowerKeyword = keyword.toLowerCase();
                for (const section of smallSections) {
                    if (lowerKeyword.includes(section)) {
                        const extracted = extractSection(response, section);
                        // console.log('[DEBUG] extractSection:', section, '| extracted:', extracted);
                        return { response: extracted, entity: intentResult.entity || null };
                    }
                }
            }
            // console.log('[DEBUG] response trả về:', response);
            return { response, entity: intentResult.entity || null };
        } catch (error) {
            console.error('Error in processMessage:', error);
            return { response: RESPONSES.UNKNOWN, entity: null };
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