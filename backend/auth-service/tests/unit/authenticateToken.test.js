const authenticateToken = require('../../src/middlewares/authenticateToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../src/config/prisma');

jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken');

  return {
    ...actual,
    verify: jest.fn(),
  };
});
jest.mock('crypto');
jest.mock('../../src/config/prisma', () => ({
  revokedToken: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

describe('middlewares - authenticateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    crypto.createHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hash_fake'),
    });
  });

  test('deve autenticar usuário com sucesso.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    jwt.verify.mockReturnValue({ id: mockDecoded.id, role: mockDecoded.role });

    prisma.revokedToken.findUnique.mockResolvedValue(null);

    prisma.user.findUnique.mockResolvedValue({
      isBlocked: false,
      blockExpires: null,
    });

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash_fake' },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: {
        isBlocked: true,
        blockExpires: true,
      },
    });
    expect(mockReq.user).toEqual({
      id: mockDecoded.id,
      role: mockDecoded.role,
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso token esteja ausente.', async () => {
    const mockReq = {
      headers: {},
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token de autenticação ausente ou mal formatado.',
    });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve retornar erro de token expirado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    jwt.verify.mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token expirado.' });
    expect(crypto.createHash).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve retornar erro de token inválido.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    jwt.verify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('jwt invalid');
    });

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token inválido.' });
    expect(crypto.createHash).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso token esteja revogado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    jwt.verify.mockReturnValue({ id: mockDecoded.id, role: mockDecoded.role });

    prisma.revokedToken.findUnique.mockResolvedValue({});

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash_fake' },
    });
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token revogado. Faça login novamente.',
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso usuário não seja encontrado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    jwt.verify.mockReturnValue({ id: mockDecoded.id, role: mockDecoded.role });

    prisma.revokedToken.findUnique.mockResolvedValue(null);

    prisma.user.findUnique.mockResolvedValue(null);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash_fake' },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: {
        isBlocked: true,
        blockExpires: true,
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não encontrado.',
    });
  });
  test('deve retornar erro caso usuário esteja bloqueado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };
    process.env.ACCESS_TOKEN_SECRET = 'secret';
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() + 7);

    jwt.verify.mockReturnValue({ id: mockDecoded.id, role: mockDecoded.role });

    prisma.revokedToken.findUnique.mockResolvedValue(null);

    prisma.user.findUnique.mockResolvedValue({
      isBlocked: true,
      blockExpires: mockDate,
    });

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash_fake' },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: {
        isBlocked: true,
        blockExpires: true,
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário bloqueado.',
    });
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    jwt.verify.mockReturnValue({ id: mockDecoded.id, role: mockDecoded.role });

    prisma.revokedToken.findUnique.mockRejectedValue(new Error('Fail'));

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash_fake' },
    });
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Ocorreu um erro inesperado no servidor.',
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
});
