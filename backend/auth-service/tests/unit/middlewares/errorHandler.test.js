jest.mock('../../../src/config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

const { errorHandler } = require('../../../src/middlewares');
const logger = require('../../../src/config/logger');
const AppError = require('../../../errors/AppError');

describe('middlewares - errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o status e a mensagem de um AppError.', () => {
    const error = new AppError('Teste AppError.', 400);
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Teste AppError.' });
    expect(logger.error).not.toHaveBeenCalled();
  });
  test('deve tratar corretamente um erro interno inesperado.', () => {
    const error = new Error('Teste de erro interno.');
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith('Teste de erro interno.', {
      stack: error.stack,
    });
  });
});
