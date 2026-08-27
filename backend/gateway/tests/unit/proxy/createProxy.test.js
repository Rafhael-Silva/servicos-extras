jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(),
  fixRequestBody: jest.fn(),
}));
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
}));

const {
  createProxyMiddleware,
  fixRequestBody,
} = require('http-proxy-middleware');
const logger = require('../../../src/config/logger');
const createProxy = require('../../../src/proxy/createProxy');

describe('proxy - createProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar o proxy com as configurações corretas.', () => {
    createProxy(process.env.URL_AUTH_SERVICE);

    const config = createProxyMiddleware.mock.calls[0][0];

    expect(config.target).toBe(process.env.URL_AUTH_SERVICE);
    expect(config.changeOrigin).toBe(true);
    expect(config.timeout).toBe(30000);
    expect(config.proxyTimeout).toBe(30000);
  });
  test('deve retornar 503 quando ocorrer erro de conexão com o serviço.', () => {
    createProxy(process.env.URL_AUTH_SERVICE);

    const config = createProxyMiddleware.mock.calls[0][0];

    const errorHandler = config.on.error;

    const mockError = new Error('Falha interna.');
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockTarget = {};

    errorHandler(mockError, mockReq, mockRes, mockTarget);

    expect(logger.error).toHaveBeenCalledWith('Erro de conexão com serviço.', {
      error: mockError,
    });
    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Serviço temporariamente indisponível.',
    });
  });
  test('deve configurar o fixRequestBody no proxyReq.', () => {
    createProxy(process.env.URL_AUTH_SERVICE);

    const config = createProxyMiddleware.mock.calls[0][0];

    expect(config.on.proxyReq).toBe(fixRequestBody);
  });
});
