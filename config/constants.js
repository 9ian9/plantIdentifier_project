module.exports = {
    PORT: process.env.PORT || 3000,
    UPLOAD_LIMIT: '5MB',
    RESPONSES: {
        UNKNOWN: "Xin lỗi, tôi chưa hiểu câu hỏi này. Bạn có thể diễn đạt lại không?",
        ERROR: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn."
    }
};