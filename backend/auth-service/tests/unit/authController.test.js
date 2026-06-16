const authService = require('../../src/services/authService');
const authController = require('../../src/controllers/authController');
const bcrypt = require('bcryptjs');
const logger = require('../../src/config/logger');
const AppError = require('../../errors/AppError');
const { VerificationType } = require('@prisma/client');

jest.mock('../../src/services/authService', () => ({
  emailExists: jest.fn(),
  cpfExists: jest.fn(),
  cnpjExists: jest.fn(),
  isUserUnderage: jest.fn(),
  sendUserCode: jest.fn(),
  resendCodeService: jest.fn(),
  verifyUserCode: jest.fn(),
  registerUserService: jest.fn(),
  verifyEmailService: jest.fn(),
  startLogin: jest.fn(),
  finalizeLogin: jest.fn(),
  logoutUserService: jest.fn(),
  storeRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  refreshTokenService: jest.fn(),
  forgotPasswordService: jest.fn(),
  resetPasswordService: jest.fn(),
  changePasswordService: jest.fn(),
  getUserProfile: jest.fn(),
}));
jest.mock('bcryptjs');
jest.mock('../../src/config/logger');

const createMockReqCandidato = (overrides = {}) => ({
  body: {
    name: 'João',
    email: 'joao@example.com',
    password: 'senha123',
    role: 'CANDIDATO',
    cpf: '12345678900',
    termsAccepted: true,
    birthDate: '1989-05-23',
    ...overrides,
  },
});

const createMockReqRecrutador = (overrides = {}) => ({
  body: {
    name: 'João',
    email: 'joao@example.com',
    password: 'senha123',
    role: 'RECRUTADOR',
    cnpj: '12345678000199',
    termsAccepted: true,
    birthDate: '1989-05-23',
    ...overrides,
  },
});

//Teste de registro de usuário.
describe('authController - registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve registrar o usuário com sucesso', async () => {
    const mockReq = createMockReqCandidato();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockResolvedValue(false);
    authService.emailExists.mockResolvedValue(false);
    authService.cpfExists.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hash_fake');

    const mockPayload = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'hash_fake',
      role: 'CANDIDATO',
      cpf: '12345678900',
      termsAccepted: true,
      birthDate: '1989-05-23',
    };

    authService.registerUserService.mockResolvedValue({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });

    await authController.registerUser(mockReq, mockRes);

    expect(authService.isUserUnderage).toHaveBeenCalledWith('1989-05-23');
    expect(authService.emailExists).toHaveBeenCalledWith('joao@example.com');
    expect(authService.cpfExists).toHaveBeenCalledWith('12345678900');
    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.password, 10);
    expect(authService.registerUserService).toHaveBeenCalledWith(mockPayload);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });
  });
  test('deve retornar erro se usuário for menor de idade.', async () => {
    const mockReq = createMockReqCandidato({
      birthDate: '2010-04-23',
    });
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockReturnValue(true);

    await authController.registerUser(mockReq, mockRes);

    expect(authService.isUserUnderage).toHaveBeenCalledWith('2010-04-23');
    expect(authService.emailExists).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Você deve ter 18 anos ou mais para se cadastrar.',
    });
  });
  test('deve capturar AppError ao validar data de nascimento', async () => {
    const mockReq = createMockReqCandidato({
      birthDate: '2000-23-aa',
    });

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockImplementation(() => {
      throw new AppError('Data inválida.', 400);
    });

    await authController.registerUser(mockReq, mockRes);

    expect(authService.isUserUnderage).toHaveBeenCalledWith(
      mockReq.body.birthDate,
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Data inválida.' });
    expect(authService.emailExists).not.toHaveBeenCalled();
  });
  test('deve retornar erro se e-mail já estiver cadastrado.', async () => {
    const mockReq = createMockReqCandidato();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockResolvedValue(false);
    authService.emailExists.mockResolvedValue(true);

    await authController.registerUser(mockReq, mockRes);

    expect(authService.emailExists).toHaveBeenCalledWith('joao@example.com');
    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'E-mail já cadastrado.',
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  test('deve retornar erro se o CPF já for cadastrado.', async () => {
    const mockReq = createMockReqCandidato();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockResolvedValue(false);
    authService.emailExists.mockResolvedValue(false);
    authService.cpfExists.mockResolvedValue(true);

    await authController.registerUser(mockReq, mockRes);

    expect(authService.cpfExists).toHaveBeenCalledWith('12345678900');
    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'CPF já cadastrado.',
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  test('deve retornar erro se o CNPJ já for cadastrado.', async () => {
    const mockReq = createMockReqRecrutador();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockResolvedValue(false);
    authService.emailExists.mockResolvedValue(false);
    authService.cnpjExists.mockResolvedValue(true);

    await authController.registerUser(mockReq, mockRes);

    expect(authService.cnpjExists).toHaveBeenCalledWith('12345678000199');
    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'CNPJ já cadastrado.',
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  test('deve retornar erro se Bcrypt falhar.', async () => {
    const mockReq = createMockReqRecrutador();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockResolvedValue(false);
    authService.emailExists.mockResolvedValue(false);
    authService.cnpjExists.mockResolvedValue(false);
    bcrypt.hash.mockRejectedValue(new Error('Erro ao criptografar password.'));

    await authController.registerUser(mockReq, mockRes);

    expect(authService.isUserUnderage).toHaveBeenCalledWith(
      mockReq.body.birthDate,
    );
    expect(authService.emailExists).toHaveBeenCalledWith(mockReq.body.email);
    expect(authService.cnpjExists).toHaveBeenCalledWith(mockReq.body.cnpj);
    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.password, 10);
    expect(authService.registerUserService).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro no cadastro.',
      expect.objectContaining({
        error: 'Erro ao criptografar password.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = createMockReqCandidato();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.isUserUnderage.mockResolvedValue(false);
    authService.emailExists.mockResolvedValue(false);
    authService.cpfExists.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hash_fake');

    authService.registerUserService.mockRejectedValue(
      new Error('Erro ao registrar usuário.'),
    );

    await authController.registerUser(mockReq, mockRes);

    expect(authService.isUserUnderage).toHaveBeenCalledWith(
      mockReq.body.birthDate,
    );
    expect(authService.emailExists).toHaveBeenCalledWith(mockReq.body.email);
    expect(authService.cpfExists).toHaveBeenCalledWith(mockReq.body.cpf);
    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.password, 10);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro no cadastro.',
      expect.objectContaining({
        error: 'Erro ao registrar usuário.',
      }),
    );
  });
});

//Teste verificação de e-mail e login automatico.
describe('authController - verifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve verificar o e-mail e fazer login com sucesso.', async () => {
    const mockReq = { body: { verificationToken: 'token_fake' } };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    const mockResult = {
      message: 'E-mail verificado e login realizado com sucesso.',
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
      user: {
        id: 'user123',
        name: 'João',
        email: 'joao@example.com',
        role: 'CANDIDATO',
      },
    };

    authService.verifyEmailService.mockResolvedValue(mockResult);

    await authController.verifyEmail(mockReq, mockRes);

    expect(authService.verifyEmailService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockResult.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: { verificationToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    authService.verifyEmailService.mockRejectedValue(
      new AppError('Tipo de verificação inválido.', 400),
    );

    await authController.verifyEmail(mockReq, mockRes);

    expect(authService.verifyEmailService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Tipo de verificação inválido.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro na verificação do e-mail.',
      expect.objectContaining({
        error: 'Tipo de verificação inválido.',
      }),
    );
    expect(mockRes.cookie).not.toHaveBeenCalled();
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: { verificationToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    authService.verifyEmailService.mockRejectedValue(new Error('Fail'));

    await authController.verifyEmail(mockReq, mockRes);

    expect(authService.verifyEmailService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro na verificação do e-mail.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//teste de reenvio de código.
describe('authController - resendCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve reenviar o código com sucesso.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        type: VerificationType.EMAIL_VERIFICATION,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResult = { message: 'Código reenviado. Verifique seu e-mail.' };

    authService.resendCodeService.mockResolvedValue(mockResult);

    await authController.resendCode(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(authService.resendCodeService).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.type,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        type: VerificationType.EMAIL_VERIFICATION,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.resendCodeService.mockRejectedValue(
      new AppError('Usuário não encontrado.', 404),
    );

    await authController.resendCode(mockReq, mockRes);

    expect(authService.resendCodeService).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não encontrado.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro na solicitação do código.',
      expect.objectContaining({
        error: 'Usuário não encontrado.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        type: VerificationType.EMAIL_VERIFICATION,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.resendCodeService.mockRejectedValue(new Error('Fail'));

    await authController.resendCode(mockReq, mockRes);

    expect(authService.resendCodeService).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro na solicitação do código.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste de verificação do código.
describe('authController - verifyUserCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve verificar o código com sucesso.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        code: '123456',
        type: VerificationType.EMAIL_VERIFICATION,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResult = {
      verificationToken: 'token_fake',
      message: 'Código validado com sucesso.',
    };

    authService.verifyUserCode.mockResolvedValue(mockResult);

    await authController.verifyUserCode(mockReq, mockRes);

    expect(authService.verifyUserCode).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.code,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        code: '123456',
        type: VerificationType.EMAIL_VERIFICATION,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.verifyUserCode.mockRejectedValue(
      new AppError('Código inválido ou expirado.', 400),
    );

    await authController.verifyUserCode(mockReq, mockRes);

    expect(authService.verifyUserCode).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.code,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Código inválido ou expirado.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro na verificação do código.',
      expect.objectContaining({
        error: 'Código inválido ou expirado.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        code: '123456',
        type: VerificationType.EMAIL_VERIFICATION,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.verifyUserCode.mockRejectedValue(new Error('Fail'));

    await authController.verifyUserCode(mockReq, mockRes);

    expect(authService.verifyUserCode).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.code,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro na verificação do código.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste de login do usuário.
describe('authController - startLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve dar início ao login com sucesso.', async () => {
    const mockReq = createMockReqCandidato();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResult = {
      message: 'Código enviado com sucesso, verifique seu e-mail.',
      id: 'user123',
      name: mockReq.body.name,
      email: mockReq.body.email,
      role: mockReq.body.role,
    };

    authService.startLogin.mockResolvedValue(mockResult);

    await authController.startLogin(mockReq, mockRes);

    expect(authService.startLogin).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.password,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        password: '123456',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.startLogin.mockRejectedValue(
      new AppError(
        'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
        403,
      ),
    );

    await authController.startLogin(mockReq, mockRes);

    expect(authService.startLogin).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.password,
    );
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro no login.',
      expect.objectContaining({
        error: 'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: {
        email: 'joao@example.com',
        password: '123456',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.startLogin.mockRejectedValue(new Error('Fail'));

    await authController.startLogin(mockReq, mockRes);

    expect(authService.startLogin).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.password,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro no login.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});
describe('authController - finalizeLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve finalizar o login com sucesso.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    const mockResult = {
      message: 'Login realizado com sucesso.',
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
      user: {
        id: 'user123',
        name: 'João',
        email: 'joao@example.com',
        role: 'CANDIDATO',
      },
    };

    authService.finalizeLogin.mockResolvedValue(mockResult);

    await authController.finalizeLogin(mockReq, mockRes);

    expect(authService.finalizeLogin).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockResult.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    authService.finalizeLogin.mockRejectedValue(
      new AppError('Tipo de verificação inválido.', 400),
    );

    await authController.finalizeLogin(mockReq, mockRes);

    expect(authService.finalizeLogin).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Tipo de verificação inválido.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao fazer login.',
      expect.objectContaining({
        error: 'Tipo de verificação inválido.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    authService.finalizeLogin.mockRejectedValue(new Error('Fail'));

    await authController.finalizeLogin(mockReq, mockRes);

    expect(authService.finalizeLogin).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao fazer login.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste de logout do usuário.
describe('authController - logoutUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve realizar logout com sucesso.', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer token-falso',
      },
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    const mockAccessToken = mockReq.headers.authorization.split(' ')[1];
    const mockRefreshToken = mockReq.cookies.refreshToken;
    const mockResult = { message: 'Logout realizado com sucesso.' };

    authService.logoutUserService.mockResolvedValue(mockResult);

    await authController.logoutUser(mockReq, mockRes);

    expect(authService.logoutUserService).toHaveBeenCalledWith(
      mockAccessToken,
      mockRefreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }),
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer token_fake',
      },
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    const accessToken = mockReq.headers.authorization.split(' ')[1];
    const refreshToken = mockReq.cookies.refreshToken;

    authService.logoutUserService.mockRejectedValue(
      new AppError('Token inválido ou expirado.', 401),
    );

    await authController.logoutUser(mockReq, mockRes);

    expect(authService.logoutUserService).toHaveBeenCalledWith(
      accessToken,
      refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token inválido ou expirado.',
    });
    expect(mockRes.clearCookie).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao fazer logout.',
      expect.objectContaining({
        error: 'Token inválido ou expirado.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer token_fake',
      },
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    const accessToken = mockReq.headers.authorization.split(' ')[1];
    const refreshToken = mockReq.cookies.refreshToken;

    authService.logoutUserService.mockRejectedValue(new Error('Fail'));

    await authController.logoutUser(mockReq, mockRes);

    expect(authService.logoutUserService).toHaveBeenCalledWith(
      accessToken,
      refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(mockRes.clearCookie).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao fazer logout.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste geração de token.
describe('authController - refreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar sucesso no refreshToken.', async () => {
    const mockReq = {
      cookies: { refreshToken: 'refresh-token-valido' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    const mockResult = {
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
    };

    authService.refreshTokenService.mockResolvedValue(mockResult);

    await authController.refreshToken(mockReq, mockRes);

    expect(authService.refreshTokenService).toHaveBeenCalledWith(
      mockReq.cookies.refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      accessToken: mockResult.accessToken,
    });
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockResult.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });
  test('deve retorna erro caso o token esteja ausente.', async () => {
    const mockReq = {
      cookies: {},
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    await authController.refreshToken(mockReq, mockRes);

    expect(authService.refreshTokenService).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Refresh token inválido ou não fornecido.',
    });
    expect(mockRes.cookie).not.toHaveBeenCalled();
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    authService.refreshTokenService.mockRejectedValue(
      new AppError('Usuário bloqueado.', 401),
    );

    await authController.refreshToken(mockReq, mockRes);

    expect(authService.refreshTokenService).toHaveBeenCalledWith(
      mockReq.cookies.refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário bloqueado.',
    });
    expect(mockRes.cookie).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao renovar token.',
      expect.objectContaining({
        error: 'Usuário bloqueado.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    authService.refreshTokenService.mockRejectedValue(new Error('Fail'));

    await authController.refreshToken(mockReq, mockRes);

    expect(authService.refreshTokenService).toHaveBeenCalledWith(
      mockReq.cookies.refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(mockRes.cookie).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao renovar token.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste início de recuperação de senha.
describe('authController - forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar sucesso ao solicitar recuperação de senha.', async () => {
    const mockReq = createMockReqCandidato();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockResult = {
      message: 'Se o e-mail existir, um código foi enviado.',
    };

    authService.forgotPasswordService.mockResolvedValue(mockResult);

    await authController.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(authService.forgotPasswordService).toHaveBeenCalledWith(
      mockReq.body.email,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = createMockReqCandidato();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.forgotPasswordService.mockRejectedValue(
      new AppError('Erro interno ao enviar código de verificação.', 500),
    );

    await authController.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno ao enviar código de verificação.',
    });
    expect(authService.forgotPasswordService).toHaveBeenCalledWith(
      mockReq.body.email,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao recuperar senha.',
      expect.objectContaining({
        error: 'Erro interno ao enviar código de verificação.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = createMockReqCandidato();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.forgotPasswordService.mockRejectedValue(new Error('Fail'));

    await authController.forgotPassword(mockReq, mockRes);

    expect(authService.forgotPasswordService).toHaveBeenCalledWith(
      mockReq.body.email,
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao recuperar senha.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste de redefinição da nova senha.
describe('authController - resetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar sucesso ao redifinir senha.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
        newPassword: 'novaSenha123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNewPasswordHash = 'hash_fake';
    const mockResult = { message: 'Senha redefinida com sucesso.' };

    bcrypt.hash.mockResolvedValue(mockNewPasswordHash);

    authService.resetPasswordService.mockResolvedValue(mockResult);

    await authController.resetPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.newPassword, 10);
    expect(authService.resetPasswordService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
      mockNewPasswordHash,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
        newPassword: 'novaSenha123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNewPasswordHash = 'hash_fake';

    bcrypt.hash.mockResolvedValue(mockNewPasswordHash);

    authService.resetPasswordService.mockRejectedValue(
      new AppError('Tipo de verificação inválido.', 400),
    );

    await authController.resetPassword(mockReq, mockRes);

    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.newPassword, 10);
    expect(authService.resetPasswordService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
      mockNewPasswordHash,
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Tipo de verificação inválido.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        error: 'Tipo de verificação inválido.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
        newPassword: 'novaSenha123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    bcrypt.hash.mockRejectedValue(new Error('Fail'));

    await authController.resetPassword(mockReq, mockRes);

    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.newPassword, 10);
    expect(authService.resetPasswordService).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste de troca de senha.
describe('authController - changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve alterar a senha com sucesso.', async () => {
    const mockReq = {
      body: {
        currentPassword: 'senhaAtual123',
        newPassword: 'novaSenha123',
      },
      user: { id: 'user123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNewPasswordHash = 'hash_fake';
    const mockResult = {
      message: 'Senha alterada com sucesso.',
    };

    bcrypt.hash.mockResolvedValue(mockNewPasswordHash);

    authService.changePasswordService.mockResolvedValue(mockResult);

    await authController.changePassword(mockReq, mockRes);

    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.newPassword, 10);
    expect(authService.changePasswordService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.body.currentPassword,
      mockNewPasswordHash,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      body: {
        currentPassword: 'senhaAtual123',
        newPassword: 'novaSenha123',
      },
      user: { id: 'user123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNewPasswordHash = 'hash_fake';

    bcrypt.hash.mockResolvedValue(mockNewPasswordHash);

    authService.changePasswordService.mockRejectedValue(
      new AppError('Senha atual incorreta.', 401),
    );

    await authController.changePassword(mockReq, mockRes);

    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.newPassword, 10);
    expect(authService.changePasswordService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.body.currentPassword,
      mockNewPasswordHash,
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Senha atual incorreta.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        error: 'Senha atual incorreta.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      body: {
        currentPassword: 'senhAtual123',
        newPassword: 'novaSenha123',
      },
      user: { id: 'user123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    bcrypt.hash.mockRejectedValue(new Error('Fail'));

    await authController.changePassword(mockReq, mockRes);

    expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.newPassword, 10);
    expect(authService.changePasswordService).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste de visualização do perfil do usuário.
describe('authController - getProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o perfil do usuário com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
    };
    const mockProfile = {
      id: mockReq.user.id,
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
      age: 25,
      cpf: '12345678900',
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.getUserProfile.mockResolvedValue(mockProfile);

    await authController.getProfile(mockReq, mockRes);

    expect(authService.getUserProfile).toHaveBeenCalledWith(mockReq.user.id);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.getUserProfile.mockRejectedValue(
      new AppError('Usuário não encontrado.', 404),
    );

    await authController.getProfile(mockReq, mockRes);

    expect(authService.getUserProfile).toHaveBeenCalledWith(mockReq.user.id);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não encontrado.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao encontrar perfil de usuário.',
      expect.objectContaining({
        error: 'Usuário não encontrado.',
      }),
    );
  });
  test('deve retornar erro 500 em caso de falha interna inesperada.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.getUserProfile.mockRejectedValue(new Error('Fail'));

    await authController.getProfile(mockReq, mockRes);

    expect(authService.getUserProfile).toHaveBeenCalledWith(mockReq.user.id);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao encontrar perfil de usuário.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});
