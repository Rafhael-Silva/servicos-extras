jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken');

  return {
    ...actual,
    verify: jest.fn(),
  };
});
jest.mock('../../../src/utils', () => ({
  generateHash: jest.fn(),
}));
jest.mock('../../../src/repositories', () => ({
  revokedTokenRepository: {
    findByTokenHash: jest.fn(),
  },
  userRepository: {
    findBlockStatus: jest.fn(),
  },
}));

const { authenticateToken } = require('../../../src/middlewares');
const jwt = require('jsonwebtoken');
const { generateHash } = require('../../../src/utils');
const {
  revokedTokenRepository,
  userRepository,
} = require('../../../src/repositories');
const { AccountType } = require('@prisma/client');

describe('middlewares - authenticateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve autenticar o usuário com sucesso.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockAccessTokenHash = 'hash-fake';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockUser = {
      isBlocked: false,
      blockExpires: null,
    };
    process.env.ACCESS_TOKEN_SECRET = 'access-secret';

    jwt.verify.mockReturnValue({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });

    generateHash.mockReturnValue(mockAccessTokenHash);

    revokedTokenRepository.findByTokenHash.mockResolvedValue(null);

    userRepository.findBlockStatus.mockResolvedValue(mockUser);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenCalledWith(mockAccessToken);
    expect(revokedTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockAccessTokenHash,
    );
    expect(userRepository.findBlockStatus).toHaveBeenCalledWith(mockDecoded.id);
    expect(mockReq.user).toEqual({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o token não seja informado.', async () => {
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
  test('deve gerar erro caso o token esteja expirado.', async () => {
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
    expect(generateHash).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o token seja inválido.', async () => {
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
      throw new jwt.JsonWebTokenError('jwt invalid.');
    });

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token inválido.' });
    expect(generateHash).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o token esteja revogado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockAccessTokenHash = 'hash-fake';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    process.env.ACCESS_TOKEN_SECRET = 'access-secret';

    jwt.verify.mockReturnValue({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });

    generateHash.mockReturnValue(mockAccessTokenHash);

    revokedTokenRepository.findByTokenHash.mockResolvedValue('revoked-token');

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenCalledWith(mockAccessToken);
    expect(revokedTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockAccessTokenHash,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token revogado. Faça login novamente.',
    });
    expect(userRepository.findBlockStatus).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário não seja encontrado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockAccessTokenHash = 'fake-hash';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    process.env.ACCESS_TOKEN_SECRET = 'access-secret';

    jwt.verify.mockReturnValue({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });

    generateHash.mockReturnValue(mockAccessTokenHash);

    revokedTokenRepository.findByTokenHash.mockResolvedValue(null);

    userRepository.findBlockStatus.mockResolvedValue(null);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenCalledWith(mockAccessToken);
    expect(revokedTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockAccessTokenHash,
    );
    expect(userRepository.findBlockStatus).toHaveBeenCalledWith(mockDecoded.id);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não encontrado.',
    });
  });
  test('deve gerar erro caso o usuário esteja bloqueado.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockAccessTokenHash = 'hash-fake';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() + 1);
    const mockUser = {
      isBlocked: true,
      blockExpires: mockDate,
    };
    process.env.ACCESS_TOKEN_SECRET = 'access-secret';

    jwt.verify.mockReturnValue({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });

    generateHash.mockReturnValue(mockAccessTokenHash);

    revokedTokenRepository.findByTokenHash.mockResolvedValue(null);

    userRepository.findBlockStatus.mockResolvedValue(mockUser);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenCalledWith(mockAccessToken);
    expect(revokedTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockAccessTokenHash,
    );
    expect(userRepository.findBlockStatus).toHaveBeenCalledWith(mockDecoded.id);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário bloqueado.',
    });
  });
  test('deve enviar erro ao middleware de error.', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockAccessToken = 'token_fake';
    const mockAccessTokenHash = 'hash-fake';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const error = new Error('Erro ao buscar token.');
    process.env.ACCESS_TOKEN_SECRET = 'secret';

    generateHash.mockReturnValue(mockAccessTokenHash);

    jwt.verify.mockReturnValue({
      id: mockDecoded.id,
      accountType: mockDecoded.accountType,
    });

    revokedTokenRepository.findByTokenHash.mockRejectedValue(error);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenCalledWith(mockAccessToken);
    expect(revokedTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockAccessTokenHash,
    );
    expect(userRepository.findBlockStatus).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});
