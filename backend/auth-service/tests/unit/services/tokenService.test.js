jest.mock('../../../src/repositories', () => ({
  refreshTokenRepository: {
    createRefreshToken: jest.fn(),
    findByTokenHash: jest.fn(),
  },
}));
jest.mock('../../../src/utils', () => ({
  generateHash: jest.fn(),
  generateToken: {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  },
}));
jest.mock('jsonwebtoken');
jest.mock('../../../src/config', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const { tokenService } = require('../../../src/services');
const { refreshTokenRepository } = require('../../../src/repositories');
const { logger } = require('../../../src/config');
const jwt = require('jsonwebtoken');
const { generateHash, generateToken } = require('../../../src/utils');
const { AccountType } = require('@prisma/client');

//Teste para verificar se o token foi salvo.
describe('tokenService - storeRefreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve armazenar o refresh token com sucesso.', async () => {
    const mockToken = 'refresh_token';
    const mockTokenHash = 'refresh-token-hash';
    const mockUserId = 'user123';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.createRefreshToken.mockResolvedValue();

    await tokenService.storeRefreshToken({
      userId: mockUserId,
      token: mockToken,
      expiresAt: mockExpiresAt,
    });

    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
      mockUserId,
      mockTokenHash,
      mockExpiresAt,
    );
  });
  test('deve gerar erro caso algum parâmetro esteja ausente.', async () => {
    const mockUserId = null;
    const mockToken = 'refresh_token';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await expect(
      tokenService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Dados inválidos.');
    expect(logger.warn).toHaveBeenCalledWith(
      'Dados inválidos ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
      }),
    );
    expect(generateHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso expiresAt não seja uma data valida.', async () => {
    const mockUserId = 'user123';
    const mockToken = 'refresh_token';
    const mockExpiresAt = new Date('abc');

    await expect(
      tokenService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Dados inválidos.');
    expect(logger.warn).toHaveBeenCalledWith(
      'Dados inválidos ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
      }),
    );
    expect(generateHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro se falhar ao salvar o refresh token', async () => {
    const mockToken = 'refresh_token';
    const mockTokenHash = 'refresh-hash';
    const mockUserId = 'user123';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.createRefreshToken.mockRejectedValue(
      new Error('Erro ao armazenar token.'),
    );

    await expect(
      tokenService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Erro interno ao armazenar refresh token.');

    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
      mockUserId,
      mockTokenHash,
      mockExpiresAt,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Erro ao armazenar token.',
      }),
    );
  });
});

//Teste para verificar se o token é válido.
describe('tokenService - verifyRefreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o payload decodificado com sucesso.', async () => {
    const mockToken = 'refresh_token';
    const mockTokenHash = 'refresh-hash';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    process.env.REFRESH_TOKEN_SECRET = 'refresh_secret';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockExistingToken = {
      id: 'token_id',
      userId: mockDecoded.id,
      tokenHash: mockTokenHash,
      expiresAt: mockExpiresAt,
    };

    generateHash.mockReturnValue(mockTokenHash);

    jwt.verify.mockReturnValue(mockDecoded);

    refreshTokenRepository.findByTokenHash.mockResolvedValue(mockExistingToken);

    const result = await tokenService.verifyRefreshToken(mockToken);

    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(refreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
    expect(result).toEqual(mockDecoded);
  });
  test('deve gerar erro caso o token esteja ausente.', async () => {
    const mockToken = null;

    await expect(tokenService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token não informado.',
    );

    expect(generateHash).not.toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a decodificação do token falhe.', async () => {
    const mockToken = 'token_corrompido';
    const mockTokenHash = 'token-hash';
    process.env.REFRESH_TOKEN_SECRET = 'token-secret';

    generateHash.mockReturnValue(mockTokenHash);

    jwt.verify.mockImplementation(() => {
      throw new Error('Falha ao decodificar token.');
    });

    await expect(tokenService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(logger.warn).toHaveBeenCalledWith(
      'Falha na verificação do refresh token.',
      expect.objectContaining({
        error: 'Falha ao decodificar token.',
      }),
    );
    expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o token não exista no DB.', async () => {
    const mockToken = 'token_inexistente';
    const mockTokenHash = 'token-hash';
    process.env.REFRESH_TOKEN_SECRET = 'refresh_fake';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };

    generateHash.mockReturnValue(mockTokenHash);

    jwt.verify.mockReturnValue(mockDecoded);

    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(tokenService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(logger.warn).toHaveBeenCalledWith(
      'Token de atualização inválido ou expirado.',
      expect.objectContaining({
        userId: mockDecoded.id,
      }),
    );
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(refreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
  });
  test('deve gerar erro caso o token esteja expirado.', async () => {
    const mockToken = 'token_inexistente';
    const mockTokenHash = 'token-hash';
    const mockExpiresAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    process.env.REFRESH_TOKEN_SECRET = 'refresh_fake';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockExistingToken = {
      id: 'token_id',
      userId: mockDecoded.id,
      tokenHash: mockTokenHash,
      expiresAt: mockExpiresAt,
    };

    generateHash.mockReturnValue(mockTokenHash);

    jwt.verify.mockReturnValue(mockDecoded);

    refreshTokenRepository.findByTokenHash.mockResolvedValue(mockExistingToken);

    await expect(tokenService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(logger.warn).toHaveBeenCalledWith(
      'Token de atualização inválido ou expirado.',
      expect.objectContaining({
        userId: mockDecoded.id,
      }),
    );
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(refreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
  });
});

//Teste para criar sessão.
describe('tokenService - createSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar sessão para o usuário com sucesso.', async () => {
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockAccessToken = 'accessToken-fake';
    const mockRefreshToken = 'refreshToken-fake';
    const mockTokenHash = 'token-hash';

    generateToken.generateAccessToken.mockReturnValue(mockAccessToken);

    generateToken.generateRefreshToken.mockReturnValue(mockRefreshToken);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.createRefreshToken.mockResolvedValue();

    const result = await tokenService.createSession(mockUser);

    expect(generateToken.generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      accountType: mockUser.accountType,
    });
    expect(generateToken.generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(generateHash).toHaveBeenCalledWith(mockRefreshToken);
    expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
      mockUser.id,
      mockTokenHash,
      expect.any(Date),
    );
    expect(result).toEqual({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  });
  test('deve gerar erro caso a geração de accessToken falhe.', async () => {
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };

    generateToken.generateAccessToken.mockImplementation(() => {
      throw new Error('Erro ao gerar accessToken.');
    });

    await expect(tokenService.createSession(mockUser)).rejects.toThrow(
      'Erro ao gerar accessToken.',
    );

    expect(generateToken.generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      accountType: mockUser.accountType,
    });
    expect(generateToken.generateRefreshToken).not.toHaveBeenCalled();
    expect(generateHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a geração de refreshToken falhe.', async () => {
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockAccessToken = 'accessToken-fake';

    generateToken.generateAccessToken.mockReturnValue(mockAccessToken);

    generateToken.generateRefreshToken.mockImplementation(() => {
      throw new Error('Erro ao gerar refreshToken.');
    });

    await expect(tokenService.createSession(mockUser)).rejects.toThrow(
      'Erro ao gerar refreshToken.',
    );

    expect(generateToken.generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      accountType: mockUser.accountType,
    });
    expect(generateToken.generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(generateHash).not.toHaveBeenCalled();
    expect(refreshTokenRepository.createRefreshToken).not.toHaveBeenCalled();
  });
  test('deve propagar o erro caso storeRefreshToken falhe.', async () => {
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockAccessToken = 'accessToken-fake';
    const mockRefreshToken = 'refreshToken-fake';
    const mockTokenHash = 'token-hash';

    generateToken.generateAccessToken.mockReturnValue(mockAccessToken);

    generateToken.generateRefreshToken.mockReturnValue(mockRefreshToken);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.createRefreshToken.mockRejectedValue(
      new Error('Erro ao armazenar token.'),
    );

    await expect(tokenService.createSession(mockUser)).rejects.toThrow(
      'Erro interno ao armazenar refresh token.',
    );

    expect(generateToken.generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      accountType: mockUser.accountType,
    });
    expect(generateToken.generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(generateHash).toHaveBeenCalledWith(mockRefreshToken);
    expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
      mockUser.id,
      mockTokenHash,
      expect.any(Date),
    );
  });
});
