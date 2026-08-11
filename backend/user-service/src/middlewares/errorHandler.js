const AppError = require('../../errors/AppError');
const logger = require('../config/logger');

const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    logger.warn(error.message);
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  logger.error(error.message, { stack: error.stack });
  return res.status(500).json({
    message: 'Erro interno no servidor.',
  });
};

module.exports = errorHandler;
