exports.validateChatInput = (req, res, next) => {
    if (!req.body.message || typeof req.body.message !== 'string' || req.body.message.trim() === '') {
        return res.status(400).json({
            error: 'Validation failed',
            details: 'Message is required and must be a non-empty string'
        });
    }
    next();
};