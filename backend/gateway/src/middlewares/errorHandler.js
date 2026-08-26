const logger = require('../config/logger');

const errorHandler = (error, req, res, next) => {
  logger.error(error.message, { stack: error.stack });

  return res.status(500).json({
    message: 'Erro interno no servidor.',
  });
};

module.exports = errorHandler;
