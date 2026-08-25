jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken');

  return {
    ...actual,
    verify: jest.fn(),
  };
});

const { authenticateToken } = require('../../../src/middlewares');
const jwt = require('jsonwebtoken');

describe('middlewares - authenticateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve autenticar o usuário com sucesso.', () => {
    const mockReq = {
      headers: { authorization: 'Bearer tokenFake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'tokenFake';
    process.env.ACCESS_TOKEN_SECRET = 'secret-fake';
    const mockDecoded = {
      id: 'user123',
      accountType: 'PERSON',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    expect(mockReq.user).toEqual({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });
  test('deve gerar erro caso token esteja ausente.', () => {
    const mockReq = {
      headers: { authorization: undefined },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token de autenticação ausente ou mal formatado.',
    });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso token esteja mal formado.', () => {
    const mockReq = {
      headers: { authorization: 'Bearer' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token de autenticação ausente ou mal formatado.',
    });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso token seja inválido.', () => {
    const mockReq = {
      headers: { authorization: 'Bearer token-invalido' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token-invalido';
    process.env.ACCESS_TOKEN_SECRET = 'secret-fake';

    jwt.verify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('Token inválido.');
    });

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token inválido.',
    });
    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso token esteja expirado.', () => {
    const mockReq = {
      headers: { authorization: 'Bearer token-expirado' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token-expirado';
    process.env.ACCESS_TOKEN_SECRET = 'secret-fake';

    jwt.verify.mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token expirado.',
    });
    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve enviar erro ao middleware de error.', () => {
    const mockReq = {
      headers: { authorization: 'Bearer token-fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token-fake';
    process.env.ACCESS_TOKEN_SECRET = 'secret-fake';
    const error = new Error('Erro ao decodificar.');

    jwt.verify.mockImplementation(() => {
      throw error;
    });

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
