const {
  createProxyMiddleware,
  fixRequestBody,
} = require('http-proxy-middleware');
const logger = require('../config/logger');

const createProxy = (urlService) => {
  return createProxyMiddleware({
    target: urlService,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      error: (error, req, res, target) => {
        logger.error('Erro de conexão com serviço.', { error });

        res.status(503).json({
          message: 'Serviço temporariamente indisponível.',
        });
      },
      proxyReq: fixRequestBody,
    },
  });
};

module.exports = createProxy;
