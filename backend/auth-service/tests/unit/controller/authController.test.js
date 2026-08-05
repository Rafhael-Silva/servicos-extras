jest.mock('../../../src/services/authService', () => ({
  resendCodeService: jest.fn(),
  registerUserService: jest.fn(),
  verifyEmailService: jest.fn(),
  startLogin: jest.fn(),
  finalizeLogin: jest.fn(),
  logoutUserService: jest.fn(),
  refreshTokenService: jest.fn(),
  forgotPasswordService: jest.fn(),
  resetPasswordService: jest.fn(),
  changePasswordService: jest.fn(),
  getUserProfile: jest.fn(),
}));
jest.mock('../../../src/services', () => ({
  verificationService: {
    verifyUserCode: jest.fn(),
  },
}));
jest.mock('../../../src/middlewares', () => ({
  asyncHandler: jest.fn((fn) => fn),
}));
jest.mock('../../../src/utils', () => ({
  cookies: {
    setRefreshTokenCookie: jest.fn(),
    clearRefreshTokenCookie: jest.fn(),
  },
}));

const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');
const { verificationService } = require('../../../src/services');
const { cookies } = require('../../../src/utils');
const { VerificationType, AccountType } = require('@prisma/client');
const AppError = require('../../../errors/AppError');

const createMockReqCandidato = (overrides = {}) => ({
  body: {
    name: 'João',
    email: 'joao@example.com',
    password: 'senha123',
    accountType: AccountType.PERSON,
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
    accountType: AccountType.COMPANY,
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

  test('deve registrar o usuário com sucesso.', async () => {
    const mockReq = createMockReqCandidato();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      message: 'Usuário registrado. Verifique seu e-mail.',
    };

    authService.registerUserService.mockResolvedValue(mockResponse);

    await authController.registerUser(mockReq, mockRes);

    expect(authService.registerUserService).toHaveBeenCalledWith(mockReq.body);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo registerUserService.', async () => {
    const mockReq = createMockReqCandidato({
      birthDate: '2010-04-23',
    });
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.registerUserService.mockRejectedValue(
      new AppError('Você deve ter 18 anos ou mais para se cadastrar.', 400),
    );

    await expect(authController.registerUser(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.registerUserService).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    };
    const mockResponse = {
      message: 'E-mail verificado e login realizado com sucesso.',
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
      user: {
        id: 'user123',
        name: 'João',
        email: 'joao@example.com',
        accountType: AccountType.PERSON,
      },
    };
    const { refreshToken, ...mockResBody } = mockResponse;

    authService.verifyEmailService.mockResolvedValue(mockResponse);

    await authController.verifyEmail(mockReq, mockRes);

    expect(authService.verifyEmailService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(cookies.setRefreshTokenCookie).toHaveBeenCalledWith(
      mockRes,
      refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResBody);
  });
  test('deve propagar o AppError retornado pelo verifyEmailService.', async () => {
    const mockReq = {
      body: { verificationToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.verifyEmailService.mockRejectedValue(
      new AppError('Tipo de verificação inválido.', 400),
    );

    await expect(authController.verifyEmail(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.verifyEmailService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(cookies.setRefreshTokenCookie).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    const mockResponse = { message: 'Código reenviado. Verifique seu e-mail.' };

    authService.resendCodeService.mockResolvedValue(mockResponse);

    await authController.resendCode(mockReq, mockRes);

    expect(authService.resendCodeService).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo resendCodeService.', async () => {
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

    await expect(authController.resendCode(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.resendCodeService).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.type,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    const mockResponse = {
      verificationToken: 'token_fake',
      message: 'Código validado com sucesso.',
    };

    verificationService.verifyUserCode.mockResolvedValue(mockResponse);

    await authController.verifyUserCode(mockReq, mockRes);

    expect(verificationService.verifyUserCode).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.code,
      mockReq.body.type,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo verifyUserCode.', async () => {
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

    verificationService.verifyUserCode.mockRejectedValue(
      new AppError('Código inválido ou expirado.', 400),
    );

    await expect(
      authController.verifyUserCode(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(verificationService.verifyUserCode).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.code,
      mockReq.body.type,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

//Teste de login do usuário.
describe('authController - startLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve dar início ao login com sucesso.', async () => {
    const mockReq = createMockReqRecrutador();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      message: 'Código enviado com sucesso, verifique seu e-mail.',
    };

    authService.startLogin.mockResolvedValue(mockResponse);

    await authController.startLogin(mockReq, mockRes);

    expect(authService.startLogin).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.password,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo startLogin.', async () => {
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
        'Acesso temporariamente bloqueado por excesso de tentativas.',
        403,
      ),
    );

    await expect(authController.startLogin(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.startLogin).toHaveBeenCalledWith(
      mockReq.body.email,
      mockReq.body.password,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    };
    const mockResponse = {
      message: 'Login realizado com sucesso.',
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
      user: {
        id: 'user123',
        name: 'João',
        email: 'joao@example.com',
        accountType: AccountType.COMPANY,
      },
    };
    const { refreshToken, ...mockResBody } = mockResponse;

    authService.finalizeLogin.mockResolvedValue(mockResponse);

    await authController.finalizeLogin(mockReq, mockRes);

    expect(authService.finalizeLogin).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(cookies.setRefreshTokenCookie).toHaveBeenCalledWith(
      mockRes,
      refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResBody);
  });
  test('deve propagar o AppError retornado pelo finalizeLogin.', async () => {
    const mockReq = {
      body: {
        verificationToken: 'token_fake',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.finalizeLogin.mockRejectedValue(
      new AppError('Tipo de verificação inválido.', 400),
    );

    await expect(
      authController.finalizeLogin(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(authService.finalizeLogin).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
    );
    expect(cookies.setRefreshTokenCookie).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    };
    const mockAccessToken = mockReq.headers.authorization.split(' ')[1];
    const mockRefreshToken = mockReq.cookies.refreshToken;
    const mockResponse = { message: 'Logout realizado com sucesso.' };

    authService.logoutUserService.mockResolvedValue(mockResponse);

    await authController.logoutUser(mockReq, mockRes);

    expect(authService.logoutUserService).toHaveBeenCalledWith(
      mockAccessToken,
      mockRefreshToken,
    );

    expect(cookies.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo logoutUserService.', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer token_fake',
      },
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const accessToken = mockReq.headers.authorization.split(' ')[1];
    const refreshToken = mockReq.cookies.refreshToken;

    authService.logoutUserService.mockRejectedValue(
      new AppError('Token inválido ou expirado.', 401),
    );

    await expect(authController.logoutUser(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.logoutUserService).toHaveBeenCalledWith(
      accessToken,
      refreshToken,
    );
    expect(cookies.clearRefreshTokenCookie).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    };
    const mockResponse = {
      accessToken: 'accessTokenFake',
      refreshToken: 'refreshTokenFake',
    };
    const { accessToken, refreshToken } = mockResponse;

    authService.refreshTokenService.mockResolvedValue(mockResponse);

    await authController.refreshToken(mockReq, mockRes);

    expect(authService.refreshTokenService).toHaveBeenCalledWith(
      mockReq.cookies.refreshToken,
    );
    expect(cookies.setRefreshTokenCookie).toHaveBeenCalledWith(
      mockRes,
      refreshToken,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ accessToken });
  });
  test('deve retornar erro caso token não seja informado.', async () => {
    const mockReq = {
      cookies: {},
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await authController.refreshToken(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Refresh token inválido ou não fornecido.',
    });
    expect(authService.refreshTokenService).not.toHaveBeenCalled();
    expect(cookies.setRefreshTokenCookie).not.toHaveBeenCalled();
  });
  test('deve propagar o AppError retornado pelo refreshTokenService.', async () => {
    const mockReq = {
      cookies: { refreshToken: 'token_fake' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.refreshTokenService.mockRejectedValue(
      new AppError('Usuário bloqueado.', 403),
    );

    await expect(authController.refreshToken(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.refreshTokenService).toHaveBeenCalledWith(
      mockReq.cookies.refreshToken,
    );
    expect(cookies.setRefreshTokenCookie).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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

    const mockResponse = {
      message: 'Se o e-mail existir, um código foi enviado.',
    };

    authService.forgotPasswordService.mockResolvedValue(mockResponse);

    await authController.forgotPassword(mockReq, mockRes);

    expect(authService.forgotPasswordService).toHaveBeenCalledWith(
      mockReq.body.email,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo forgotPasswordService.', async () => {
    const mockReq = createMockReqCandidato();

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    authService.forgotPasswordService.mockRejectedValue(
      new AppError('Erro interno ao enviar código de verificação.', 500),
    );

    await expect(
      authController.forgotPassword(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(authService.forgotPasswordService).toHaveBeenCalledWith(
      mockReq.body.email,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    const mockResponse = { message: 'Senha redefinida com sucesso.' };

    authService.resetPasswordService.mockResolvedValue(mockResponse);

    await authController.resetPassword(mockReq, mockRes);

    expect(authService.resetPasswordService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
      mockReq.body.newPassword,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo resetPasswordService.', async () => {
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

    authService.resetPasswordService.mockRejectedValue(
      new AppError('Tipo de verificação inválido.', 400),
    );

    await expect(
      authController.resetPassword(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(authService.resetPasswordService).toHaveBeenCalledWith(
      mockReq.body.verificationToken,
      mockReq.body.newPassword,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    const mockResponse = {
      message: 'Senha alterada com sucesso.',
    };

    authService.changePasswordService.mockResolvedValue(mockResponse);

    await authController.changePassword(mockReq, mockRes);

    expect(authService.changePasswordService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.body.currentPassword,
      mockReq.body.newPassword,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
  test('deve propagar o AppError retornado pelo changePasswordService.', async () => {
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

    authService.changePasswordService.mockRejectedValue(
      new AppError('Senha atual incorreta.', 401),
    );

    await expect(
      authController.changePassword(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(authService.changePasswordService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.body.currentPassword,
      mockReq.body.newPassword,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
      accountType: AccountType.PERSON,
      userAge: 20,
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
  test('deve propagar o AppError retornado pelo getUserProfile.', async () => {
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

    await expect(authController.getProfile(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(authService.getUserProfile).toHaveBeenCalledWith(mockReq.user.id);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});
