class PlantList {
    constructor() {
        this.plants = [
            "đậu phộng", "vải", "dưa hấu", "bơ", "táo", "cà phê", "keo", "mít", "đu đủ",
            "dưa leo", "xoài", "chuối", "mận", "dừa", "cà chua", "nha đam", "trà", "sắn",
            "mãng cầu", "ớt"
        ];
        this.plants_en = [
            "peanut", "lychee", "watermelon", "avocado", "apple", "coffee", "acacia", "jackfruit", "papaya",
            "cucumber", "mango", "banana", "plum", "coconut", "tomato", "aloe vera", "tea", "cassava",
            "soursop", "chili"
        ];

        this.scientificNames = {
            "đậu phộng": "Arachis hypogaea",
            "vải": "Litchi chinensis",
            "dưa hấu": "Citrullus lanatus",
            "bơ": "Persea americana",
            "táo": "Malus domestica",
            "cà phê": "Coffea spp.",
            "keo": "Acacia spp.",
            "mít": "Artocarpus heterophyllus",
            "đu đủ": "Carica papaya",
            "dưa leo": "Cucumis sativus",
            "xoài": "Mangifera indica",
            "chuối": "Musa spp.",
            "mận": "Prunus salicina",
            "dừa": "Cocos nucifera",
            "cà chua": "Solanum lycopersicum",
            "nha đam": "Aloe vera",
            "trà": "Camellia sinensis",
            "sắn": "Manihot esculenta",
            "mãng cầu": "Annona spp.",
            "ớt": "Capsicum spp."
        };
    }

    getAllPlants() {
        return this.plants;
    }

    getAllPlantsEn() {
        return this.plants_en;
    }

    getScientificName(plant) {
        return this.scientificNames[plant] || null;
    }

    isValidPlant(plant) {
        return this.plants.includes(plant);
    }
}

module.exports = new PlantList();