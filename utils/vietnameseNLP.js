const vntk = require('vntk');

class VietnameseNLP {
    constructor() {
        this.tokenizer = vntk.wordTokenizer();
        this.stopwords = vntk.stopwords();
        this.posTagger = vntk.posTag();
        this.ner = vntk.ner();
    }

    tokenize(text) {
        return this.tokenizer.tag(text);
    }

    removeStopwords(tokens) {
        return tokens.filter(token => !this.stopwords.includes(token));
    }

    posTagging(text) {
        return this.posTagger.tag(text);
    }

    recognizeEntities(text) {
        return this.ner.tag(text);
    }

    normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}

module.exports = new VietnameseNLP();