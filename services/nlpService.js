const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const logger = require('../utils/logger');
const intents = require('../models/intents');
const langdetect = require('langdetect');

// Danh sách stopwords tiếng Việt rút gọn
const VIETNAMESE_STOPWORDS = ['à', 'bị', 'bởi', 'cả', 'các', 'cái', 'cho', 'chứ', 'có', 'của'];

class NLPService {
    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.initializeClassifier();
    }

    initializeClassifier() {
        console.log('Training classifier with intents:');
        Object.entries(intents).forEach(([intentName, intentData]) => {
            // console.log(`Intent: ${intentName}`);
            // console.log('Patterns:', intentData.patterns);

            intentData.patterns.forEach(pattern => {
                const processed = this.simplePreprocess(pattern);
                this.classifier.addDocument(processed, intentName);
            });
        });

        this.classifier.train();
        console.log('Training completed');
    }

    simplePreprocess(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
            .replace(/[^\w\s]/g, '') // Bỏ ký tự đặc biệt
            .replace(/\s+/g, ' '); // Chuẩn hóa khoảng trắng
    }

    findBestIntent(userInput) {
        try {
            const processedInput = this.simplePreprocess(userInput);

            // Nhận diện ngôn ngữ
            const lang = langdetect.detectOne(userInput); // 'vi' hoặc 'en'
            console.log('Detected language:', lang);

            // Lọc intents theo ngôn ngữ
            let filteredIntents = Object.entries(intents);
            if (lang === 'vi') {
                filteredIntents = filteredIntents.filter(([name]) => !name.endsWith('_en'));
            } else if (lang === 'en') {
                filteredIntents = filteredIntents.filter(([name]) => name.endsWith('_en'));
            }
            // console.log('Filtered intents:', filteredIntents.map(([name]) => name));

            // Nếu không nhận diện được ngôn ngữ, fallback dùng toàn bộ intents
            if ((!lang || (lang !== 'vi' && lang !== 'en')) && filteredIntents.length === 0) {
                filteredIntents = Object.entries(intents);
                console.log('Fallback to all intents');
            }

            // Tạo classifier tạm thời cho ngôn ngữ này
            const tempClassifier = new natural.BayesClassifier();
            filteredIntents.forEach(([intentName, intentData]) => {
                intentData.patterns.forEach(pattern => {
                    const processed = this.simplePreprocess(pattern);
                    tempClassifier.addDocument(processed, intentName);
                });
            });
            tempClassifier.train();

            const classifications = tempClassifier.getClassifications(processedInput);
            // console.log('Classifications for input:', processedInput, classifications);
            if (classifications.length === 0) return null;

            const topClassification = classifications[0];
            if (topClassification.value < 0.01) {
                return null;
            }

            const intent = intents[topClassification.label];
            if (intent && intent.entities) {
                // Ưu tiên nhận diện entity ở cuối câu
                let matchedEntity = null;
                for (const entity of intent.entities) {
                    const entityNorm = this.simplePreprocess(entity);
                    // So khớp entity ở cuối câu hoặc bất kỳ vị trí nào
                    const regex = new RegExp(`(?:\\b|\s)${entityNorm}(?:\\b|\s|$)`, 'i');
                    if (processedInput.endsWith(entityNorm) || regex.test(processedInput)) {
                        matchedEntity = entity;
                        break;
                    }
                }
                console.log('Matched entity in nlpService.js:', matchedEntity);
                if (matchedEntity) {
                    const response = intent.responses[matchedEntity];
                    return {
                        intent: topClassification.label,
                        confidence: topClassification.value,
                        entity: matchedEntity,
                        response: response
                    };
                }
            }

            return {
                intent: topClassification.label,
                confidence: topClassification.value
            };
        } catch (error) {
            logger.error(`NLP error: ${error}`);
            return null;
        }
    }
}

module.exports = new NLPService();