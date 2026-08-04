jest.mock('../../../src/services', () => ({
  verificationService: {
    sendUserCode: jest.fn(),
    verifyVerificationToken: jest.fn(),
  },
  userService: {
    emailExists: jest.fn(),
    cpfExists: jest.fn(),
    cnpjExists: jest.fn(),
    createUser: jest.fn(),
  },
  tokenService: {
    createSession: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
  emailService: {
    sendWelcomeEmail: jest.fn(),
  },
}));
jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    markEmailAsVerified: jest.fn(),
    findLoginData: jest.fn(),
    unlockUser: jest.fn(),
    resetLoginAttempts: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    blockUser: jest.fn(),
    findById: jest.fn(),
    updateLastLogin: jest.fn(),
    findTokenValidationData: jest.fn(),
    updatePassword: jest.fn(),
    findPasswordHash: jest.fn(),
    findProfileData: jest.fn(),
  },
  revokedTokenRepository: {
    createRevokedToken: jest.fn(),
  },
  refreshTokenRepository: {
    deleteByTokenHash: jest.fn(),
    deleteByUserId: jest.fn(),
  },
}));
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../../src/utils', () => ({
  generateHash: jest.fn(),
  generateToken: {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generateVerificationToken: jest.fn(),
  },
  normalizeEmail: jest.fn(),
  age: {
    isUserUnderage: jest.fn(),
    calculateAge: jest.fn(),
  },
}));
jest.mock('../../../src/config', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const authService = require('../../../src/services/authService');
const {
  emailService,
  userService,
  tokenService,
  verificationService,
} = require('../../../src/services');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../../errors/AppError');
const { generateHash, normalizeEmail, age } = require('../../../src/utils');
const { logger } = require('../../../src/config');
const {
  userRepository,
  refreshTokenRepository,
  revokedTokenRepository,
} = require('../../../src/repositories');
const { Prisma, VerificationType, AccountType } = require('@prisma/client');
const AUTH = require('../../../src/constants/auth');

//Teste de reenvio de código.
describe('authService - resendCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve reenviar o código com sucesso.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    normalizeEmail.mockReturnValue('joao@example.com');

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationService.sendUserCode.mockResolvedValue();

    const result = await authService.resendCodeService(
      mockUser.email,
      VerificationType.PASSWORD_RESET,
    );

    expect(normalizeEmail).toHaveBeenCalledWith(mockUser.email);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.PASSWORD_RESET,
    );
    expect(result).toEqual({
      message: 'Código reenviado. Verifique seu e-mail.',
    });
  });
  test('deve gerar erro se os dados de entrada forem inválidos.', async () => {
    const mockEmail = 'joao@example.com';
    const mockType = undefined;

    await expect(
      authService.resendCodeService(mockEmail, mockType),
    ).rejects.toThrow('Dados inválidos');
    expect(normalizeEmail).not.toHaveBeenCalled();
  });
  test('deve propagar o erro caso o repositório falhe.', async () => {
    const mockEmail = 'joao@example.com';

    normalizeEmail.mockReturnValue('joao@example.com');

    userRepository.findByEmail.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.resendCodeService(mockEmail, VerificationType.PASSWORD_RESET),
    ).rejects.toThrow('Fail');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith('joao@example.com');
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve gerar erro se usuário não for encontrado.', async () => {
    const mockEmail = 'joao@example.com';

    normalizeEmail.mockReturnValue('joao@example.com');

    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.resendCodeService(mockEmail, VerificationType.PASSWORD_RESET),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith('joao@example.com');
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve propagar o erro caso sendUserCode falhe.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    normalizeEmail.mockReturnValue('joao@example.com');

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationService.sendUserCode.mockRejectedValue(new Error('Fail.'));

    await expect(
      authService.resendCodeService(
        mockUser.email,
        VerificationType.PASSWORD_RESET,
      ),
    ).rejects.toThrow('Fail.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockUser.email);
    expect(userRepository.findByEmail).toHaveBeenCalledWith('joao@example.com');
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.PASSWORD_RESET,
    );
  });
});

//Teste registrar usuário.
describe('authService - registerUserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve criar usuário e enviar código de verificação', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: '12345678900',
      cnpj: null,
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockPasswordHash = 'fake_hash';

    const mockUser = {
      id: 'fake_id',
      name: userData.name,
      email: userData.email,
      passwordHash: mockPasswordHash,
      accountType: userData.accountType,
      cpf: userData.cpf,
      cnpj: userData.cnpj,
      termsAccepted: userData.termsAccepted,
      birthDate: userData.birthDate,
    };

    const mockCreateUser = {
      name: userData.name,
      email: userData.email,
      passwordHash: mockPasswordHash,
      accountType: userData.accountType,
      cpf: userData.cpf,
      cnpj: null,
      termsAccepted: true,
      birthDate: userData.birthDate,
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue(null);

    userService.cpfExists.mockResolvedValue(null);

    bcrypt.hash.mockResolvedValue(mockPasswordHash);

    userService.createUser.mockResolvedValue(mockUser);

    verificationService.sendUserCode.mockResolvedValue();

    const result = await authService.registerUserService(userData);

    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(userService.cpfExists).toHaveBeenCalledWith(userData.cpf);
    expect(bcrypt.hash).toHaveBeenCalledWith(
      userData.password,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userService.createUser).toHaveBeenCalledWith(mockCreateUser);
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.EMAIL_VERIFICATION,
    );
    expect(result).toEqual({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });
  });
  test('deve gerar erro caso usuário seja menor de idade.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: '12345678900',
      cnpj: null,
      termsAccepted: true,
      birthDate: new Date('2009-01-01'),
    };

    age.isUserUnderage.mockReturnValue(true);

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'Você deve ter 18 anos ou mais para se cadastrar.',
    );

    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de cadastro de menor de idade.',
    );
    expect(userService.emailExists).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso E-mail já exista.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: '12345678900',
      cnpj: null,
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue({
      id: 'user123',
      email: userData.email,
    });

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'E-mail já cadastrado.',
    );
    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de cadastro com e-mail já existente.',
      { email: userData.email },
    );
    expect(userService.cpfExists).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso CPF já exista.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: '12345678900',
      cnpj: null,
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue(null);

    userService.cpfExists.mockResolvedValue({ id: 'user123' });

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'CPF já cadastrado.',
    );
    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(userService.cpfExists).toHaveBeenCalledWith(userData.cpf);
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de cadastro com CPF já existente.',
    );
    expect(userService.cnpjExists).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso CNPJ já exista.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: null,
      cnpj: '12345678901234',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue(null);

    userService.cnpjExists.mockResolvedValue({ id: 'user123' });

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'CNPJ já cadastrado.',
    );
    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(userService.cnpjExists).toHaveBeenCalledWith(userData.cnpj);
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de cadastro com CNPJ já existente.',
    );
    expect(userService.cpfExists).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  test('deve propagar o erro caso a geração do hash da senha falhe.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: null,
      cnpj: '12345678901234',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue(null);

    userService.cnpjExists.mockResolvedValue(null);

    bcrypt.hash.mockRejectedValue(new Error('Fail.'));

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'Fail.',
    );
    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(userService.cnpjExists).toHaveBeenCalledWith(userData.cnpj);
    expect(userService.cpfExists).not.toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith(
      userData.password,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userService.createUser).not.toHaveBeenCalled();
  });
  test('deve propagar o erro caso createUser falhe.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: '12345698742',
      cnpj: null,
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockPasswordHash = 'fake_hash';

    const mockCreateUser = {
      name: userData.name,
      email: userData.email,
      passwordHash: mockPasswordHash,
      accountType: userData.accountType,
      cpf: userData.cpf,
      cnpj: null,
      termsAccepted: true,
      birthDate: userData.birthDate,
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue(null);

    userService.cpfExists.mockResolvedValue(null);

    bcrypt.hash.mockResolvedValue(mockPasswordHash);

    userService.createUser.mockRejectedValue(
      new AppError('Tipo de usuário inválido.'),
    );

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'Tipo de usuário inválido.',
    );
    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(userService.cpfExists).toHaveBeenCalledWith(userData.cpf);
    expect(bcrypt.hash).toHaveBeenCalledWith(
      userData.password,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userService.createUser).toHaveBeenCalledWith(mockCreateUser);
    expect(userService.cnpjExists).not.toHaveBeenCalled();
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve gerar AppError caso sendUserCode falhe.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      accountType: AccountType.PERSON,
      cpf: '12345698742',
      cnpj: null,
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockPasswordHash = 'fake_hash';

    const mockUser = {
      id: 'fake_id',
      name: userData.name,
      email: userData.email,
      passwordHash: mockPasswordHash,
      accountType: userData.accountType,
      cpf: userData.cpf,
      cnpj: userData.cnpj,
      termsAccepted: userData.termsAccepted,
      birthDate: userData.birthDate,
    };

    const mockCreateUser = {
      name: userData.name,
      email: userData.email,
      passwordHash: mockPasswordHash,
      accountType: userData.accountType,
      cpf: userData.cpf,
      cnpj: null,
      termsAccepted: true,
      birthDate: userData.birthDate,
    };

    age.isUserUnderage.mockReturnValue(false);

    userService.emailExists.mockResolvedValue(null);

    userService.cpfExists.mockResolvedValue(null);

    bcrypt.hash.mockResolvedValue(mockPasswordHash);

    userService.createUser.mockResolvedValue(mockUser);

    verificationService.sendUserCode.mockRejectedValue(
      new AppError('Erro interno ao enviar e-mail de verificação.'),
    );

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'Erro interno ao enviar e-mail de verificação.',
    );
    expect(age.isUserUnderage).toHaveBeenCalledWith(userData.birthDate);
    expect(userService.emailExists).toHaveBeenCalledWith(userData.email);
    expect(userService.cpfExists).toHaveBeenCalledWith(userData.cpf);
    expect(bcrypt.hash).toHaveBeenCalledWith(
      userData.password,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userService.createUser).toHaveBeenCalledWith(mockCreateUser);
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.EMAIL_VERIFICATION,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar e-mail de verificação.',
      {
        userId: mockUser.id,
        error: 'Erro interno ao enviar e-mail de verificação.',
      },
    );
    expect(userService.cnpjExists).not.toHaveBeenCalled();
  });
});

//Teste de validação de e-mail.
describe('authService - verifyEmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve validar E-mail do usuário com sucesso e gerar login.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
    };
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.EMAIL_VERIFICATION,
    };

    const mockSession = {
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.markEmailAsVerified.mockResolvedValue(mockUser);

    tokenService.createSession.mockResolvedValue(mockSession);

    emailService.sendWelcomeEmail.mockResolvedValue();

    const result = await authService.verifyEmailService(mockVerificationToken);

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.markEmailAsVerified).toHaveBeenCalledWith(
      mockDecoded.userId,
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      mockUser.name,
      mockUser.email,
    );
    expect(result).toEqual({
      message: 'E-mail verificado e login realizado com sucesso.',
      ...mockSession,
      user: mockUser,
    });
  });
  test('deve gerar erro caso não receba o token.', async () => {
    await expect(authService.verifyEmailService(undefined)).rejects.toThrow(
      'Token não informado.',
    );

    expect(verificationService.verifyVerificationToken).not.toHaveBeenCalled();
    expect(userRepository.markEmailAsVerified).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o tipo de verificação for inválida.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'INVALID_TYPE',
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    await expect(
      authService.verifyEmailService(mockVerificationToken),
    ).rejects.toThrow('Tipo de verificação inválido.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.markEmailAsVerified).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso a atualização da verificação do e-mail falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.EMAIL_VERIFICATION,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.markEmailAsVerified.mockRejectedValue(new Error('DB error'));

    await expect(
      authService.verifyEmailService(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao concluir verificação do e-mail.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.markEmailAsVerified).toHaveBeenCalledWith(
      mockDecoded.userId,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao verificar e-mail e fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'DB error',
      }),
    );
    expect(tokenService.createSession).not.toHaveBeenCalled();
    expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso createSession falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.EMAIL_VERIFICATION,
    };
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.markEmailAsVerified.mockResolvedValue(mockUser);

    tokenService.createSession.mockRejectedValue(
      new Error('Erro ao gerar sessão.'),
    );

    await expect(
      authService.verifyEmailService(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao concluir verificação do e-mail.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.markEmailAsVerified).toHaveBeenCalledWith(
      mockDecoded.userId,
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao verificar e-mail e fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Erro ao gerar sessão.',
      }),
    );
    expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });
  test('deve continuar fluxo mesmo com erro ao enviar e-mail', async () => {
    const mockVerificationToken = 'token_fake';
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
    };
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.EMAIL_VERIFICATION,
    };
    const mockSession = {
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.markEmailAsVerified.mockResolvedValue(mockUser);

    tokenService.createSession.mockResolvedValue(mockSession);

    emailService.sendWelcomeEmail.mockRejectedValue(
      new Error('Erro ao enviar e-mail.'),
    );

    const result = await authService.verifyEmailService(mockVerificationToken);

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.markEmailAsVerified).toHaveBeenCalledWith(
      mockDecoded.userId,
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      mockUser.name,
      mockUser.email,
    );
    expect(result).toEqual({
      message: 'E-mail verificado e login realizado com sucesso.',
      ...mockSession,
      user: mockUser,
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Falha ao enviar e-mail de boas-vindas.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Erro ao enviar e-mail.',
      }),
    );
  });
});

//Teste de autenticação do usuário.
describe('authService - startLogin', () => {
  const mockEmail = 'joao@example.com';
  const mockPassword = 'senha123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o código com sucesso.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashfake123',
      emailVerified: true,
      accountType: AccountType.PERSON,
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    verificationService.sendUserCode.mockResolvedValue();

    userRepository.resetLoginAttempts.mockResolvedValue();

    const result = await authService.startLogin(mockEmail, mockPassword);

    expect(normalizeEmail).toHaveBeenCalledWith('joao@example.com');
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.LOGIN,
    );
    expect(userRepository.resetLoginAttempts).toHaveBeenCalledWith(mockUser.id);
    expect(result).toEqual({
      message: 'Código enviado com sucesso, verifique seu e-mail.',
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Código enviado com sucesso.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
  });
  test('deve gerar erro caso algum parâmetro não for informado.', async () => {
    const mockEmail = 'joao@example.com';

    await expect(authService.startLogin(mockEmail)).rejects.toThrow(
      'Dados inválidos',
    );
    expect(normalizeEmail).not.toHaveBeenCalled();
    expect(userRepository.findLoginData).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso o E-mail não existir.', async () => {
    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(null);

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Credenciais inválidas.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      AUTH.FAKE_PASSWORD_HASH,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de login com email inexistente.',
      expect.objectContaining({
        email: mockEmail.toLowerCase().trim(),
      }),
    );
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve liberar acesso caso o tempo de bloqueio estiver expirado.', async () => {
    const mockNow = new Date();
    const mockDateExpired = new Date(mockNow.getTime() - 24 * 60 * 60 * 1000);
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
      passwordHash: 'hash_fake',
      emailVerified: true,
      isBlocked: true,
      loginAttempts: 0,
      blockExpires: mockDateExpired,
    };

    const mockUnblockedUser = {
      ...mockUser,
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    userRepository.unlockUser.mockResolvedValue(mockUnblockedUser);

    bcrypt.compare.mockResolvedValue(true);

    verificationService.sendUserCode.mockResolvedValue();

    userRepository.resetLoginAttempts.mockResolvedValue();

    const result = await authService.startLogin(mockEmail, mockPassword);

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.unlockUser).toHaveBeenCalledWith(mockUser.id);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUnblockedUser.passwordHash,
    );
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUnblockedUser,
      VerificationType.LOGIN,
    );
    expect(userRepository.resetLoginAttempts).toHaveBeenCalledWith(
      mockUnblockedUser.id,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Código enviado com sucesso.',
      expect.objectContaining({
        userId: mockUnblockedUser.id,
      }),
    );
    expect(result).toEqual({
      message: 'Código enviado com sucesso, verifique seu e-mail.',
    });
  });
  test('deve retornar erro caso o templo de bloqueio não tenha expirado.', async () => {
    const now = new Date();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const mockBlockExpires = new Date(now.getTime() + FIFTEEN_MINUTES);
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      accountType: AccountType.PERSON,
      emailVerified: true,
      isBlocked: true,
      loginAttempts: 0,
      blockExpires: mockBlockExpires,
    };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Conta temporariamente bloqueada.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(userRepository.unlockUser).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de login em conta bloqueada.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso o e-mail não esteja verificado.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      accountType: AccountType.PERSON,
      emailVerified: false,
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Verifique seu e-mail antes de realizar o login.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de login com e-mail não verificado.',
      expect.objectContaining({
        userId: mockUser.id,
        email: mockUser.email,
      }),
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(userRepository.unlockUser).not.toHaveBeenCalled();
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve retornar erro caso a senha esteja incorreta.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      accountType: AccountType.PERSON,
      emailVerified: true,
      isBlocked: false,
      loginAttempts: 1,
      blockExpires: null,
    };

    const mockAttempts = { loginAttempts: 1 };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(false);

    userRepository.incrementLoginAttempts.mockResolvedValue(mockAttempts);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Credenciais inválidas.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(userRepository.incrementLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Senha inválida.',
      expect.objectContaining({
        userId: mockUser.id,
        email: mockUser.email,
      }),
    );
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve bloquear usuário por excesso de tentativas.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      accountType: AccountType.PERSON,
      emailVerified: true,
      isBlocked: false,
      loginAttempts: 5,
      blockExpires: null,
    };

    const mockAttempts = { loginAttempts: 5 };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(false);

    userRepository.incrementLoginAttempts.mockResolvedValue(mockAttempts);

    userRepository.blockUser.mockResolvedValue();

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow(
      'Acesso temporariamente bloqueado por excesso de tentativas.',
    );

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(userRepository.incrementLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Senha inválida.',
      expect.objectContaining({
        userId: mockUser.id,
        email: mockUser.email,
      }),
    );
    expect(userRepository.blockUser).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário bloqueado por excesso de tentativas.',
      expect.objectContaining({
        userId: mockUser.id,
        loginAttempts: mockAttempts.loginAttempts,
      }),
    );
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o envio do código falhar.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashfake123',
      emailVerified: true,
      accountType: AccountType.PERSON,
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };

    normalizeEmail.mockReturnValue(mockEmail);

    userRepository.findLoginData.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    verificationService.sendUserCode.mockRejectedValue(
      new Error('Erro ao enviar código.'),
    );

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Erro interno ao tentar enviar código, tente novamente.');

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findLoginData).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.LOGIN,
    );
    expect(logger.error).toHaveBeenCalledWith('Erro ao tentar enviar código', {
      userId: mockUser.id,
      error: 'Erro ao enviar código.',
    });
    expect(userRepository.resetLoginAttempts).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
describe('authService - finalizeLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve finalizar o login com sucesso', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };
    const mockSession = {
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
    };
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.findById.mockResolvedValue(mockUser);

    userRepository.updateLastLogin.mockResolvedValue();

    tokenService.createSession.mockResolvedValue(mockSession);

    const result = await authService.finalizeLogin(mockVerificationToken);

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.findById).toHaveBeenCalledWith(mockDecoded.userId);
    expect(userRepository.updateLastLogin).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({
      message: 'Login realizado com sucesso.',
      ...mockSession,
      user: mockUser,
    });
  });
  test('deve gerar erro caso o token esteja ausente.', async () => {
    const mockVerificationToken = undefined;

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Token não informado.');

    expect(verificationService.verifyVerificationToken).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o tipo de vericação seja inválida.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.PASSWORD_RESET,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Tipo de verificação inválido.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.findById).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário não seja encontrado.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.findById.mockResolvedValue(null);

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.findById).toHaveBeenCalledWith(mockDecoded.userId);
    expect(logger.error).toHaveBeenCalledWith('Erro ao tentar fazer login.', {
      userId: mockDecoded.userId,
      error: 'Usuário não encontrado.',
    });
    expect(userRepository.updateLastLogin).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a atualização do último login falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.findById.mockResolvedValue(mockUser);

    userRepository.updateLastLogin.mockRejectedValue(
      new Error('Erro ao atualizar último login.'),
    );

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao tentar fazer login.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.findById).toHaveBeenCalledWith(mockDecoded.userId);
    expect(userRepository.updateLastLogin).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(logger.error).toHaveBeenCalledWith('Erro ao tentar fazer login.', {
      userId: mockDecoded.userId,
      error: 'Erro ao atualizar último login.',
    });
    expect(tokenService.createSession).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso createSession falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    userRepository.findById.mockResolvedValue(mockUser);

    userRepository.updateLastLogin.mockResolvedValue();

    tokenService.createSession.mockRejectedValue(
      new Error('Erro ao criar sessão.'),
    );

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao tentar fazer login.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(userRepository.findById).toHaveBeenCalledWith(mockDecoded.userId);
    expect(userRepository.updateLastLogin).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
    expect(logger.error).toHaveBeenCalledWith('Erro ao tentar fazer login.', {
      userId: mockDecoded.userId,
      error: 'Erro ao criar sessão.',
    });
  });
});

//Teste de logout.
describe('authService - logoutUserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve realizar o logout e revogar o token com sucesso.', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'fake-secret';
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';
    const mockAccessTokenHash = 'fake-access-hash';
    const mockRefreshTokenHash = 'fake-refresh-hash';

    jwt.verify.mockReturnValue({
      id: 'user123',
      accountType: AccountType.PERSON,
    });

    generateHash
      .mockReturnValueOnce(mockAccessTokenHash)
      .mockReturnValueOnce(mockRefreshTokenHash);

    revokedTokenRepository.createRevokedToken.mockResolvedValue();

    refreshTokenRepository.deleteByTokenHash.mockResolvedValue();

    const result = await authService.logoutUserService(
      mockAccessToken,
      mockRefreshToken,
    );

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(revokedTokenRepository.createRevokedToken).toHaveBeenCalledWith(
      mockAccessTokenHash,
      expect.any(Date),
    );
    expect(generateHash).toHaveBeenNthCalledWith(1, mockAccessToken);
    expect(generateHash).toHaveBeenNthCalledWith(2, mockRefreshToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockRefreshTokenHash,
    );
    expect(result).toEqual({ message: 'Logout realizado com sucesso.' });
    expect(logger.info).toHaveBeenCalledWith(
      'Logout realizado com sucesso.',
      expect.objectContaining({ userId: 'user123' }),
    );
  });
  test('deve gerar erro caso algum parâmetro não seja fornecido', async () => {
    const mockAccessToken = null;
    const mockRefreshToken = 'refresh_fake';
    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Token não informado.');

    expect(jwt.verify).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a decodificação do token falhe.', async () => {
    const mockAccessToken = 'access_fake';
    const mockRefreshToken = 'refresh_fake';
    process.env.ACCESS_TOKEN_SECRET = 'fake-secret';

    jwt.verify.mockImplementation(() => {
      throw new Error('Token inválido.');
    });

    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Token inválido ou expirado.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).not.toHaveBeenCalled();
  });
  test('deve continuar o logout quando o access token já estiver na blacklist.', async () => {
    const mockAccessToken = 'access_fake';
    const mockRefreshToken = 'refresh_fake';
    const mockAccessTokenHash = 'fake-access-hash';
    const mockRefreshTokenHash = 'fake-refresh-hash';
    process.env.ACCESS_TOKEN_SECRET = 'fake_secret';
    const mockErrorP2002 = new Prisma.PrismaClientKnownRequestError(
      'Token já encontra-se na black list.',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
      },
    );

    jwt.verify.mockReturnValue({
      id: 'user123',
      accountType: AccountType.PERSON,
    });

    generateHash
      .mockReturnValueOnce(mockAccessTokenHash)
      .mockReturnValueOnce(mockRefreshTokenHash);

    revokedTokenRepository.createRevokedToken.mockRejectedValue(mockErrorP2002);

    refreshTokenRepository.deleteByTokenHash.mockResolvedValue();

    const result = await authService.logoutUserService(
      mockAccessToken,
      mockRefreshToken,
    );

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenNthCalledWith(1, mockAccessToken);
    expect(generateHash).toHaveBeenNthCalledWith(2, mockRefreshToken);
    expect(revokedTokenRepository.createRevokedToken).toHaveBeenCalledWith(
      mockAccessTokenHash,
      expect.any(Date),
    );
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockRefreshTokenHash,
    );
    expect(logger.warn).toHaveBeenCalledWith('Token já está na blacklist.');
    expect(result).toEqual({ message: 'Logout realizado com sucesso.' });
    expect(logger.info).toHaveBeenCalledWith(
      'Logout realizado com sucesso.',
      expect.objectContaining({ userId: 'user123' }),
    );
  });
  test('deve gerar erro caso falha ao salvar token revogado.', async () => {
    const mockAccessToken = 'access_fake';
    const mockAccessTokenHash = 'fake-access-hash';
    const mockRefreshToken = 'refresh_fake';
    process.env.ACCESS_TOKEN_SECRET = 'secret_fake';

    jwt.verify.mockReturnValue({
      id: 'user123',
      accountType: AccountType.COMPANY,
    });

    generateHash.mockReturnValue(mockAccessTokenHash);

    revokedTokenRepository.createRevokedToken.mockRejectedValue(
      new Error('Erro ao revogar token.'),
    );

    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Erro ao revogar token.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(generateHash).toHaveBeenNthCalledWith(1, mockAccessToken);
    expect(generateHash).toHaveBeenCalledTimes(1);
    expect(revokedTokenRepository.createRevokedToken).toHaveBeenCalledWith(
      mockAccessTokenHash,
      expect.any(Date),
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(refreshTokenRepository.deleteByTokenHash).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso falhe ao remover refresh token.', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'fake-secret';
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';
    const mockAccessTokenHash = 'fake-access-hash';
    const mockRefreshTokenHash = 'fake-refresh-hash';

    jwt.verify.mockReturnValue({
      id: 'user123',
      accountType: AccountType.PERSON,
    });

    generateHash
      .mockReturnValueOnce(mockAccessTokenHash)
      .mockReturnValueOnce(mockRefreshTokenHash);

    revokedTokenRepository.createRevokedToken.mockResolvedValue();

    refreshTokenRepository.deleteByTokenHash.mockRejectedValue(
      new Error('Erro ao deletar token.'),
    );

    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Erro ao deletar token.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(revokedTokenRepository.createRevokedToken).toHaveBeenCalledWith(
      mockAccessTokenHash,
      expect.any(Date),
    );
    expect(generateHash).toHaveBeenNthCalledWith(1, mockAccessToken);
    expect(generateHash).toHaveBeenNthCalledWith(2, mockRefreshToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockRefreshTokenHash,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});

//Teste para gerar novo Access e refresh Token.
describe('authService - refreshTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve gerar nova sessão com sucesso.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = 'fake-token-hash';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
      isBlocked: false,
    };
    const accessToken = 'accessToken_fake';
    const refreshToken = 'refreshToken_fake';

    tokenService.verifyRefreshToken.mockResolvedValue(mockDecoded);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.deleteByTokenHash.mockResolvedValue();

    userRepository.findTokenValidationData.mockResolvedValue(mockUser);

    tokenService.createSession.mockResolvedValue({ accessToken, refreshToken });

    const result = await authService.refreshTokenService(mockToken);

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
    expect(userRepository.findTokenValidationData).toHaveBeenCalledWith(
      mockDecoded.id,
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({
      accessToken,
      refreshToken,
    });
  });
  test('deve gerar erro caso o serviço de decodificação falhe.', async () => {
    const mockToken = 'token_fake';

    tokenService.verifyRefreshToken.mockRejectedValue(
      new AppError('Token de atualização inválido ou expirado.'),
    );

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    expect(generateHash).not.toHaveBeenCalled();
    expect(refreshTokenRepository.deleteByTokenHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a remoção do refresh token falhe.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = 'fake-token-hash';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };

    tokenService.verifyRefreshToken.mockResolvedValue(mockDecoded);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.deleteByTokenHash.mockRejectedValue(
      new Error('Erro ao remover token.'),
    );

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Erro ao remover token.',
    );

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
    expect(userRepository.findTokenValidationData).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso usuário não seja encontrado.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = 'fake-token-hash';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };

    tokenService.verifyRefreshToken.mockResolvedValue(mockDecoded);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.deleteByTokenHash.mockResolvedValue();

    userRepository.findTokenValidationData.mockResolvedValue(null);

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Usuário não encontrado.',
    );

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
    expect(userRepository.findTokenValidationData).toHaveBeenCalledWith(
      mockDecoded.id,
    );
    expect(tokenService.createSession).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso usuário esteja bloqueado.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = 'fake-token-hash';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
      isBlocked: true,
    };

    tokenService.verifyRefreshToken.mockResolvedValue(mockDecoded);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.deleteByTokenHash.mockResolvedValue();

    userRepository.findTokenValidationData.mockResolvedValue(mockUser);

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Usuário bloqueado.',
    );

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
    expect(userRepository.findTokenValidationData).toHaveBeenCalledWith(
      mockDecoded.id,
    );
    expect(tokenService.createSession).not.toHaveBeenCalled();
  });
  test('deve propagar o erro caso a criação da nova sessão falhe.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = 'fake-token-hash';
    const mockDecoded = {
      id: 'user123',
      accountType: AccountType.PERSON,
    };
    const mockUser = {
      id: 'user123',
      accountType: AccountType.PERSON,
      isBlocked: false,
    };

    tokenService.verifyRefreshToken.mockResolvedValue(mockDecoded);

    generateHash.mockReturnValue(mockTokenHash);

    refreshTokenRepository.deleteByTokenHash.mockResolvedValue();

    userRepository.findTokenValidationData.mockResolvedValue(mockUser);

    tokenService.createSession.mockRejectedValue(
      new Error('Erro ao gerar nova sessão.'),
    );

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Erro ao gerar nova sessão.',
    );

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    expect(generateHash).toHaveBeenCalledWith(mockToken);
    expect(refreshTokenRepository.deleteByTokenHash).toHaveBeenCalledWith(
      mockTokenHash,
    );
    expect(userRepository.findTokenValidationData).toHaveBeenCalledWith(
      mockDecoded.id,
    );
    expect(tokenService.createSession).toHaveBeenCalledWith(mockUser);
  });
});

//Teste de envio de E-mail para redefinir a senha.
describe('authService - forgotPasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve enviar o e-mail de recuperação se o usuário existir.', async () => {
    const mockEmail = ' teste@examplE.com';
    const mockNormalizedEmail = 'teste@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationService.sendUserCode.mockResolvedValue();

    const result = await authService.forgotPasswordService(mockEmail);

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.PASSWORD_RESET,
    );
    expect(result).toEqual({
      message: 'Se o e-mail existir, um código foi enviado.',
    });
  });
  test('deve gerar erro caso o parâmetro esteja ausente.', async () => {
    const mockEmail = null;

    await expect(authService.forgotPasswordService(mockEmail)).rejects.toThrow(
      'Dados inválidos.',
    );

    expect(normalizeEmail).not.toHaveBeenCalled();
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });
  test('deve retornar sucesso mesmo que o usuário não exista.', async () => {
    const mockEmail = ' teste@examplE.com';
    const mockNormalizedEmail = 'teste@example.com';

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(null);

    const result = await authService.forgotPasswordService(mockEmail);

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationService.sendUserCode).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Se o e-mail existir, um código foi enviado.',
    });
  });
  test('deve gerar erro caso o envio do código falhar.', async () => {
    const mockEmail = ' teste@examplE.com';
    const mockNormalizedEmail = 'teste@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    verificationService.sendUserCode.mockRejectedValue(
      new Error('Erro ao enviar código.'),
    );

    await expect(authService.forgotPasswordService(mockEmail)).rejects.toThrow(
      'Erro interno ao enviar código de verificação.',
    );

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(verificationService.sendUserCode).toHaveBeenCalledWith(
      mockUser,
      VerificationType.PASSWORD_RESET,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar código de verificação.',
      {
        userId: mockUser.id,
        error: 'Erro ao enviar código.',
      },
    );
  });
});

//Teste para redefinir a senha.
describe('authService - resetPasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve redefinir a senha com sucesso.', async () => {
    const mockVerificationToken = 'token_valido';
    const mockPassword = 'password_fake';
    const mockNewPasswordhash = 'fake-hash';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.PASSWORD_RESET,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    bcrypt.hash.mockResolvedValue(mockNewPasswordhash);

    userRepository.updatePassword.mockResolvedValue();

    refreshTokenRepository.deleteByUserId.mockResolvedValue();

    const result = await authService.resetPasswordService(
      mockVerificationToken,
      mockPassword,
    );

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      mockDecoded.userId,
      mockNewPasswordhash,
    );
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
      mockDecoded.userId,
    );
    expect(result).toEqual({ message: 'Senha redefinida com sucesso.' });
  });
  test('deve gerar erro caso algum parâmetro esteja ausente.', async () => {
    const mockVerificationToken = undefined;
    const mockPassword = 'password_fake';

    await expect(
      authService.resetPasswordService(mockVerificationToken, mockPassword),
    ).rejects.toThrow('Dados inválidos.');

    expect(verificationService.verifyVerificationToken).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o tipo de token for inválido.', async () => {
    const mockVerificationToken = 'token_valido';
    const mockPassword = 'password_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    await expect(
      authService.resetPasswordService(mockVerificationToken, mockPassword),
    ).rejects.toThrow('Tipo de verificação inválido.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso bcryp.hash falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockPassword = 'senha123';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.PASSWORD_RESET,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    bcrypt.hash.mockRejectedValue(new Error('Erro ao gerar hash.'));

    await expect(
      authService.resetPasswordService(mockVerificationToken, mockPassword),
    ).rejects.toThrow('Falha interna ao redefinir senha.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Erro ao gerar hash.',
      }),
    );
  });
  test('deve gerar erro caso a atualização da senha no DB falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockPassword = 'senha123';
    const mockNewPasswordhash = 'fake-hash';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.PASSWORD_RESET,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    bcrypt.hash.mockResolvedValue(mockNewPasswordhash);

    userRepository.updatePassword.mockRejectedValue(
      new Error('Erro ao atualizar senha.'),
    );

    await expect(
      authService.resetPasswordService(mockVerificationToken, mockPassword),
    ).rejects.toThrow('Falha interna ao redefinir senha.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      mockDecoded.userId,
      mockNewPasswordhash,
    );
    expect(refreshTokenRepository.deleteByUserId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Erro ao atualizar senha.',
      }),
    );
  });
  test('deve gerar erro caso o delete do refresh token falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockPassword = 'senha123';
    const mockNewPasswordhash = 'fake-hash';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.PASSWORD_RESET,
    };

    verificationService.verifyVerificationToken.mockResolvedValue(mockDecoded);

    bcrypt.hash.mockResolvedValue(mockNewPasswordhash);

    userRepository.updatePassword.mockResolvedValue();

    refreshTokenRepository.deleteByUserId.mockRejectedValue(
      new Error('Erro ao deletar token.'),
    );

    await expect(
      authService.resetPasswordService(mockVerificationToken, mockPassword),
    ).rejects.toThrow('Falha interna ao redefinir senha.');

    expect(verificationService.verifyVerificationToken).toHaveBeenCalledWith(
      mockVerificationToken,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      mockDecoded.userId,
      mockNewPasswordhash,
    );
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
      mockDecoded.userId,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Erro ao deletar token.',
      }),
    );
  });
});

//Teste que altera a senha.
describe('authService - changePasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve alterar a senha com sucesso.', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senha-atual-123';
    const mockNewPassword = 'nova-senha';
    const mockNewPasswordhash = 'new_hash_fake';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    userRepository.findPasswordHash.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    bcrypt.hash.mockResolvedValue(mockNewPasswordhash);

    userRepository.updatePassword.mockResolvedValue();

    refreshTokenRepository.deleteByUserId.mockResolvedValue();

    const result = await authService.changePasswordService(
      mockUserId,
      mockCurrentPassword,
      mockNewPassword,
    );

    expect(userRepository.findPasswordHash).toHaveBeenCalledWith(mockUserId);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockNewPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      mockUserId,
      mockNewPasswordhash,
    );
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
      mockUserId,
    );
    expect(result).toEqual({ message: 'Senha alterada com sucesso.' });
  });
  test('deve gerar erro caso algum parâmetro esteja ausente.', async () => {
    const mockUserId = null;
    const mockCurrentPassword = 'senhaAtual123';
    const mockNewPassword = 'senha_nova';

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword,
      ),
    ).rejects.toThrow('Dados inválidos.');

    expect(userRepository.findPasswordHash).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário não seja encontrado.', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPassword = 'nova-senha';

    userRepository.findPasswordHash.mockResolvedValue(null);

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword,
      ),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(userRepository.findPasswordHash).toHaveBeenCalledWith(mockUserId);
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Usuário não encontrado.',
      }),
    );
  });
  test('deve lançar um erro caso bcrypt.compare falhe', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPassword = 'nova-senha';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    userRepository.findPasswordHash.mockResolvedValue(mockUser);

    bcrypt.compare.mockRejectedValue(new Error('Erro ao comparar senha.'));

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword,
      ),
    ).rejects.toThrow('Falha interna ao alterar senha.');

    expect(userRepository.findPasswordHash).toHaveBeenCalledWith(mockUserId);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Erro ao comparar senha.',
      }),
    );
  });
  test('deve lançar um erro caso a atualização da senha falhe.', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPassword = 'nova-senha';
    const mockNewPasswordhash = 'new-hash-fake';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    userRepository.findPasswordHash.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    bcrypt.hash.mockResolvedValue(mockNewPasswordhash);

    userRepository.updatePassword.mockRejectedValue(
      new Error('Erro ao atualizar senha.'),
    );

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword,
      ),
    ).rejects.toThrow('Falha interna ao alterar senha.');

    expect(userRepository.findPasswordHash).toHaveBeenCalledWith(mockUserId);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockNewPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      mockUserId,
      mockNewPasswordhash,
    );
    expect(refreshTokenRepository.deleteByUserId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Erro ao atualizar senha.',
      }),
    );
  });
  test('deve lançar um erro caso o delete refresh token falhe.', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPassword = 'nova-senha';
    const mockNewPasswordhash = 'new-hash-fake';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    userRepository.findPasswordHash.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    bcrypt.hash.mockResolvedValue(mockNewPasswordhash);

    userRepository.updatePassword.mockResolvedValue();

    refreshTokenRepository.deleteByUserId.mockRejectedValue(
      new Error('Erro ao deletar token.'),
    );

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword,
      ),
    ).rejects.toThrow('Falha interna ao alterar senha.');

    expect(userRepository.findPasswordHash).toHaveBeenCalledWith(mockUserId);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      mockNewPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      mockUserId,
      mockNewPasswordhash,
    );
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
      mockUserId,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Erro ao deletar token.',
      }),
    );
  });
});

//Teste que visualiza o perfil do usuário.
describe('authService - getUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o perfil do usuário com sucesso.', async () => {
    const mockUserId = 'user123';
    const mockUser = {
      id: mockUserId,
      name: 'João',
      email: 'joao@example.com',
      accountType: AccountType.PERSON,
      birthDate: new Date('2000-01-01'),
    };
    const mockUserAge = 26;

    userRepository.findProfileData.mockResolvedValue(mockUser);

    age.calculateAge.mockReturnValue(mockUserAge);

    const result = await authService.getUserProfile(mockUserId);

    expect(userRepository.findProfileData).toHaveBeenCalledWith(mockUserId);
    expect(age.calculateAge).toHaveBeenCalledWith(mockUser.birthDate);
    expect(result).toEqual(
      expect.objectContaining({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        accountType: mockUser.accountType,
        userAge: mockUserAge,
      }),
    );
  });
  test('deve gerar erro caso algum parâmetro esteja ausente.', async () => {
    const mockUserId = null;

    await expect(authService.getUserProfile(mockUserId)).rejects.toThrow(
      'Dados inválidos.',
    );

    expect(userRepository.findProfileData).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a busca pelo usuário falhe.', async () => {
    const mockUserId = 'user123';

    userRepository.findProfileData.mockRejectedValue(
      new Error('Erro ao buscar usuário.'),
    );

    await expect(authService.getUserProfile(mockUserId)).rejects.toThrow(
      'Erro interno ao buscar perfil.',
    );

    expect(userRepository.findProfileData).toHaveBeenCalledWith(mockUserId);
    expect(age.calculateAge).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao buscar perfil do usuário.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Erro ao buscar usuário.',
      }),
    );
  });
  test('deve gerar erro caso o usuário não seja encontrado', async () => {
    const mockUserId = 'user123';

    userRepository.findProfileData.mockResolvedValue(null);

    await expect(authService.getUserProfile(mockUserId)).rejects.toThrow(
      'Usuário não encontrado.',
    );

    expect(userRepository.findProfileData).toHaveBeenCalledWith(mockUserId);
    expect(age.calculateAge).not.toHaveBeenCalled();
  });
});
