jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
}));

const logger = require('../../../src/config/logger');
const errorHandler = require('../../../src/middlewares/errorHandler');

describe('middlewares - errorHandler', () => {
  test('deve tratar corretamente um erro interno inesperado.', () => {
    const mockError = new Error('Erro inesperado.');
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith('Erro inesperado.', {
      stack: mockError.stack,
    });
  });
});
