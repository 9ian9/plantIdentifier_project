const app = require('./app');
const { PORT } = require('./config/constants');
const logger = require('./utils/logger');

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});