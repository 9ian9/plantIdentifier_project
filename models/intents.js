module.exports = {
    chao_hoi: {
        patterns: [
            "xin chào", "chào bạn", "hi", "hello",
            "chào buổi sáng", "chào buổi chiều"
        ],
        responses: [
            "Xin chào! Tôi có thể giúp gì cho bạn về đặc điểm cây trồng?",
            "Chào bạn! Bạn muốn biết thông tin về loại cây nào?"
        ],
        context: "greeting"
    },
    ten_khoa_hoc: {
        patterns: [
            "tên khoa học của cây {cây}",
            "cây {cây} có tên khoa học là gì",
            "cho biết tên khoa học của {cây}",
            "tên khoa học {cây}"
        ],
        responses: {
            "lúa": "Tên khoa học của cây lúa là Oryza sativa L.",
            "xoài": "Tên khoa học của cây xoài là Mangifera indica.",
            "cà phê": "Tên khoa học của cây cà phê là Coffea spp.",
            "tiêu": "Tên khoa học của cây tiêu là Piper nigrum."
        },
        entities: ["lúa", "xoài", "cà phê", "tiêu"],
        context: "scientific_name"
    },
    dac_diem_sinh_hoc: {
        patterns: [
            "đặc điểm sinh học của {cây}",
            "{cây} có đặc điểm sinh học gì",
            "mô tả đặc điểm sinh học {cây}",
            "đặc điểm thực vật học của {cây}"
        ],
        responses: {
            "lúa": "Cây lúa thuộc họ Poaceae, thân thảo, cao 1-1.8m. Lá dài, hẹp, có bẹ ôm thân. Rễ chùm, phát triển trong đất ngập nước.",
            "xoài": "Cây xoài thuộc họ Anacardiaceae, thân gỗ cao 10-15m. Lá đơn, mọc so le, phiến lá dày. Hoa nhỏ, màu trắng hoặc vàng nhạt."
        },
        entities: ["lúa", "xoài"],
        context: "biological_characteristics"
    }
    // Có thể thêm các intents khác
};