jest.mock('../../../src/config/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../../src/repositories', () => ({
  verificationCodeRepository: {
    countRecentValidCodes: jest.fn(),
    replaceVerificationCode: jest.fn(),
    deleteExpiredCodes: jest.fn(),
    findLatestValidCode: jest.fn(),
    incrementCodeAttempts: jest.fn(),
    markCodeAsUsed: jest.fn(),
    consumeCode: jest.fn(),
  },
  userRepository: {
    findByEmail: jest.fn(),
  },
}));
jest.mock('../../../src/utils', () => ({
  generateHash: jest.fn(),
  normalizeEmail: jest.fn(),
  generateToken: {
    generateVerificationToken: jest.fn(),
  },
}));
jest.mock('../../../src/services/emailService', () => ({
  sendVerificationCode: jest.fn(),
}));
jest.mock('crypto', () => {
  const originalCrypto = jest.requireActual('crypto');

  return {
    ...originalCrypto,
    randomInt: jest.fn(),
  };
});
jest.mock('jsonwebtoken');

const verificationService = require('../../../src/services/verificationService');
const emailService = require('../../../src/services/emailService');
const logger = require('../../../src/config/logger');
const {
  verificationCodeRepository,
  userRepository,
} = require('../../../src/repositories');
const {
  generateHash,
  normalizeEmail,
  generateToken,
} = require('../../../src/utils');
const { VerificationType } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

//Teste envio de código.
describe('verificationService - sendUserCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve enviar código com sucesso', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };
    const mockType = VerificationType.LOGIN;
    const mockCode = '123456';
    const mockCodeHash = 'fake-code-hash';

    verificationCodeRepository.countRecentValidCodes.mockResolvedValue(0);

    crypto.randomInt.mockReturnValue(mockCode);

    generateHash.mockReturnValue(mockCodeHash);

    verificationCodeRepository.replaceVerificationCode.mockResolvedValue();

    emailService.sendVerificationCode.mockResolvedValue();

    const result = await verificationService.sendUserCode(mockUser, mockType);

    expect(result).toEqual({ message: 'Código enviado com sucesso.' });
    expect(
      verificationCodeRepository.countRecentValidCodes,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
      expect.any(Date),
    );
    expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(
      verificationCodeRepository.replaceVerificationCode,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      mockCodeHash,
      expect.any(Date),
      expect.any(Date),
    );
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      mockUser.email,
      mockCode,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Código enviado.',
      expect.objectContaining({
        userId: mockUser.id,
        type: mockType,
      }),
    );
  });
  test('deve gerar erro caso o usuário não seja informado.', async () => {
    const mockUser = null;
    const mockType = VerificationType.LOGIN;

    await expect(
      verificationService.sendUserCode(mockUser, mockType),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(
      verificationCodeRepository.countRecentValidCodes,
    ).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o limite de envio de código seja atingido.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };
    const mockType = VerificationType.LOGIN;

    verificationCodeRepository.countRecentValidCodes.mockResolvedValue(5);

    await expect(
      verificationService.sendUserCode(mockUser, mockType),
    ).rejects.toThrow(
      'Aguarde alguns minutos antes de solicitar um novo código.',
    );

    expect(
      verificationCodeRepository.countRecentValidCodes,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
      expect.any(Date),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Limite de envio de código atingido.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(crypto.randomInt).not.toHaveBeenCalled();
    expect(generateHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso replaceVerificationCode falhe.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };
    const mockType = VerificationType.LOGIN;
    const mockCode = '123456';
    const mockCodeHash = 'fake-hash';

    verificationCodeRepository.countRecentValidCodes.mockResolvedValue(0);

    crypto.randomInt.mockReturnValue(mockCode);

    generateHash.mockReturnValue(mockCodeHash);

    verificationCodeRepository.replaceVerificationCode.mockRejectedValue(
      new Error('Erro ao armazenar código.'),
    );

    await expect(
      verificationService.sendUserCode(mockUser, mockType),
    ).rejects.toThrow('Erro ao armazenar código.');

    expect(
      verificationCodeRepository.countRecentValidCodes,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
      expect.any(Date),
    );
    expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(
      verificationCodeRepository.replaceVerificationCode,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      mockCodeHash,
      expect.any(Date),
      expect.any(Date),
    );
    expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o envio do E-mail falhe.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };
    const mockType = VerificationType.LOGIN;
    const mockCode = '123456';
    const mockCodeHash = 'fake-hash';

    verificationCodeRepository.countRecentValidCodes.mockResolvedValue(0);

    crypto.randomInt.mockReturnValue(mockCode);

    generateHash.mockReturnValue(mockCodeHash);

    verificationCodeRepository.replaceVerificationCode.mockResolvedValue();

    emailService.sendVerificationCode.mockRejectedValue(
      new Error('Erro ao enviar código.'),
    );

    await expect(
      verificationService.sendUserCode(mockUser, mockType),
    ).rejects.toThrow('Erro interno ao enviar código de verificação.');

    expect(
      verificationCodeRepository.countRecentValidCodes,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
      expect.any(Date),
    );
    expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(
      verificationCodeRepository.replaceVerificationCode,
    ).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      mockCodeHash,
      expect.any(Date),
      expect.any(Date),
    );
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      mockUser.email,
      mockCode,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar código de verificação.',
      {
        userId: mockUser.id,
        error: 'Erro ao enviar código.',
      },
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});

//Teste validação de código.
describe('verificationService - verifyUserCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve validar o código com sucesso.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;
    const mockCodeHash = 'fake-hash';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      attempts: 0,
      codeHash: mockCodeHash,
    };
    const mockUpdated = {
      count: 1,
    };
    const mockVerificationToken = 'token-fake';

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationCodeRepository.deleteExpiredCodes.mockResolvedValue();

    verificationCodeRepository.findLatestValidCode.mockResolvedValue(
      mockRecord,
    );

    generateHash.mockReturnValue(mockCodeHash);

    verificationCodeRepository.consumeCode.mockResolvedValue(mockUpdated);

    generateToken.generateVerificationToken.mockReturnValue(
      mockVerificationToken,
    );

    const result = await verificationService.verifyUserCode(
      mockEmail,
      mockCode,
      mockType,
    );

    expect(result).toEqual({
      verificationToken: mockVerificationToken,
      message: 'Código validado com sucesso.',
    });

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationCodeRepository.deleteExpiredCodes).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(verificationCodeRepository.findLatestValidCode).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
    );
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(verificationCodeRepository.consumeCode).toHaveBeenCalledWith(
      mockRecord.id,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Código validado com sucesso.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(generateToken.generateVerificationToken).toHaveBeenCalledWith({
      userId: mockUser.id,
      type: mockType,
    });
  });
  test('deve gerar erro caso algum parâmetro não seja informado.', async () => {
    const mockEmail = 'joao@example.com';
    const mockCode = undefined;
    const mockType = undefined;

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Dados inválidos');

    expect(normalizeEmail).not.toHaveBeenCalled();
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário não seja encontrado.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(
      verificationCodeRepository.deleteExpiredCodes,
    ).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o delete de códigos expirados falhe.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;
    const mockUser = {
      id: 'user122',
      email: 'joao@example.com',
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationCodeRepository.deleteExpiredCodes.mockRejectedValue(
      new Error('Erro ao deletar códigos.'),
    );

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Erro ao deletar códigos.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationCodeRepository.deleteExpiredCodes).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(
      verificationCodeRepository.findLatestValidCode,
    ).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o último código válido não seja encontrado.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;
    const mockUser = {
      id: 'user122',
      email: 'joao@example.com',
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationCodeRepository.deleteExpiredCodes.mockResolvedValue();

    verificationCodeRepository.findLatestValidCode.mockResolvedValue(null);

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationCodeRepository.deleteExpiredCodes).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(verificationCodeRepository.findLatestValidCode).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Código inválido informado.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(generateHash).not.toHaveBeenCalled();
    expect(verificationCodeRepository.consumeCode).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o código digitado seja inválido.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;
    const mockUser = {
      id: 'user122',
      email: 'joao@example.com',
    };
    const mockCodeHash = 'fake-hash';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      attempts: 0,
      codeHash: mockCodeHash,
    };
    const mockAttempts = {
      attempts: 1,
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationCodeRepository.deleteExpiredCodes.mockResolvedValue();

    verificationCodeRepository.findLatestValidCode.mockResolvedValue(
      mockRecord,
    );

    generateHash.mockReturnValue('hash-error');

    verificationCodeRepository.incrementCodeAttempts.mockResolvedValue(
      mockAttempts,
    );

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationCodeRepository.deleteExpiredCodes).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(verificationCodeRepository.findLatestValidCode).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
    );
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(
      verificationCodeRepository.incrementCodeAttempts,
    ).toHaveBeenCalledWith(mockRecord.id);
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de código inválido.',
      expect.objectContaining({
        userId: mockUser.id,
        type: mockType,
      }),
    );
    expect(verificationCodeRepository.consumeCode).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o limite de tentativas seja excedido.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;
    const mockUser = {
      id: 'user122',
      email: 'joao@example.com',
    };
    const mockCodeHash = 'fake-hash';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      attempts: 0,
      codeHash: mockCodeHash,
    };
    const mockAttempts = {
      attempts: 5,
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationCodeRepository.deleteExpiredCodes.mockResolvedValue();

    verificationCodeRepository.findLatestValidCode.mockResolvedValue(
      mockRecord,
    );

    generateHash.mockReturnValue('hash-error');

    verificationCodeRepository.incrementCodeAttempts.mockResolvedValue(
      mockAttempts,
    );

    verificationCodeRepository.markCodeAsUsed.mockResolvedValue();

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Muitas tentativas inválidas. Solicite um novo código.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationCodeRepository.deleteExpiredCodes).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(verificationCodeRepository.findLatestValidCode).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
    );
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(
      verificationCodeRepository.incrementCodeAttempts,
    ).toHaveBeenCalledWith(mockRecord.id);
    expect(verificationCodeRepository.markCodeAsUsed).toHaveBeenCalledWith(
      mockRecord.id,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Limite de tentativas excedido.',
      expect.objectContaining({
        userId: mockUser.id,
        type: mockType,
      }),
    );
    expect(verificationCodeRepository.consumeCode).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o código tenha sido utilizado.', async () => {
    const mockEmail = 'joAo@example.com ';
    const mockNormalizedEmail = 'joao@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };
    const mockCode = '123456';
    const mockType = VerificationType.LOGIN;
    const mockCodeHash = 'fake-hash';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      attempts: 0,
      codeHash: mockCodeHash,
    };
    const mockUpdated = {
      count: 0,
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationCodeRepository.deleteExpiredCodes.mockResolvedValue();

    verificationCodeRepository.findLatestValidCode.mockResolvedValue(
      mockRecord,
    );

    generateHash.mockReturnValue(mockCodeHash);

    verificationCodeRepository.consumeCode.mockResolvedValue(mockUpdated);

    await expect(
      verificationService.verifyUserCode(mockEmail, mockCode, mockType),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationCodeRepository.deleteExpiredCodes).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(verificationCodeRepository.findLatestValidCode).toHaveBeenCalledWith(
      mockUser.id,
      mockType,
      expect.any(Date),
    );
    expect(generateHash).toHaveBeenCalledWith(mockCode);
    expect(verificationCodeRepository.consumeCode).toHaveBeenCalledWith(
      mockRecord.id,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Código já utilizado.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(generateToken.generateVerificationToken).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});

//teste validação de token.
describe('verificationService - verifyVerificationToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve verificar o token com sucesso.', () => {
    const mockToken = 'token_fake';
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };

    jwt.verify.mockReturnValue({
      userId: mockDecoded.userId,
      type: mockDecoded.type,
    });

    const result = verificationService.verifyVerificationToken(mockToken);

    expect(result).toEqual(mockDecoded);
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
  });
  test('deve gerar erro caso o token não seja informado.', () => {
    const mockToken = undefined;

    expect(() =>
      verificationService.verifyVerificationToken(mockToken),
    ).toThrow('Token não informado.');

    expect(jwt.verify).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a verificação do token falhar.', () => {
    const mockToken = 'token_fake';
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';

    jwt.verify.mockImplementation(() => {
      throw new Error('Erro ao decodificar token.');
    });

    expect(() =>
      verificationService.verifyVerificationToken(mockToken),
    ).toThrow('Token inválido ou expirado.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Falha na verificação do token.',
      expect.objectContaining({
        error: 'Erro ao decodificar token.',
      }),
    );
  });
});
