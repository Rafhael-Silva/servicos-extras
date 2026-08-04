const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Prisma, VerificationType } = require('@prisma/client');
const {
  userRepository,
  revokedTokenRepository,
  refreshTokenRepository,
} = require('../repositories');
const { logger } = require('../config');
const AppError = require('../../errors/AppError');
const {
  userService,
  tokenService,
  verificationService,
  emailService,
} = require('./');
const { age, normalizeEmail, generateHash } = require('../utils');
const AUTH = require('../constants/auth');

const registerUserService = async ({
  name,
  email,
  password,
  accountType,
  cpf,
  cnpj,
  termsAccepted,
  birthDate,
}) => {
  if (age.isUserUnderage(birthDate)) {
    logger.warn('Tentativa de cadastro de menor de idade.');
    throw new AppError('Você deve ter 18 anos ou mais para se cadastrar.', 400);
  }

  if (await userService.emailExists(email)) {
    logger.warn('Tentativa de cadastro com e-mail já existente.', { email });
    throw new AppError('E-mail já cadastrado.', 409);
  }

  if (cpf && (await userService.cpfExists(cpf))) {
    logger.warn('Tentativa de cadastro com CPF já existente.');
    throw new AppError('CPF já cadastrado.', 409);
  }

  if (cnpj && (await userService.cnpjExists(cnpj))) {
    logger.warn('Tentativa de cadastro com CNPJ já existente.');
    throw new AppError('CNPJ já cadastrado.', 409);
  }

  const passwordHash = await bcrypt.hash(password, AUTH.BCRYPT_SALT_ROUNDS);

  const user = await userService.createUser({
    name,
    email,
    passwordHash,
    accountType,
    cpf,
    cnpj,
    termsAccepted,
    birthDate,
  });

  try {
    await verificationService.sendUserCode(
      user,
      VerificationType.EMAIL_VERIFICATION,
    );
  } catch (error) {
    logger.error('Erro ao enviar e-mail de verificação.', {
      userId: user.id,
      error: error.message,
    });
    throw new AppError('Erro interno ao enviar e-mail de verificação.', 500);
  }

  return { message: 'Usuário registrado. Verifique seu e-mail.' };
};

const verifyEmailService = async (verificationToken) => {
  if (!verificationToken) {
    throw new AppError('Token não informado.', 400);
  }

  const decoded =
    await verificationService.verifyVerificationToken(verificationToken);

  if (decoded.type !== VerificationType.EMAIL_VERIFICATION) {
    throw new AppError('Tipo de verificação inválido.', 400);
  }

  let user;
  let session;

  try {
    user = await userRepository.markEmailAsVerified(decoded.userId);

    session = await tokenService.createSession(user);
  } catch (error) {
    logger.error('Erro ao verificar e-mail e fazer login.', {
      userId: decoded.userId,
      error: error.message,
    });
    throw new AppError('Erro interno ao concluir verificação do e-mail.', 500);
  }

  try {
    await emailService.sendWelcomeEmail(user.name, user.email);
  } catch (error) {
    logger.error('Falha ao enviar e-mail de boas-vindas.', {
      userId: decoded.userId,
      error: error.message,
    });
  }

  return {
    message: 'E-mail verificado e login realizado com sucesso.',
    ...session,
    user,
  };
};

const resendCodeService = async (email, type) => {
  if (!email || !type) {
    throw new AppError('Dados inválidos', 400);
  }

  const normalizedEmail = normalizeEmail(email);

  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  await verificationService.sendUserCode(user, type);

  return { message: 'Código reenviado. Verifique seu e-mail.' };
};

const startLogin = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Dados inválidos', 400);
  }

  const now = new Date();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password);

  let user = await userRepository.findLoginData(normalizedEmail);

  if (!user) {
    await bcrypt.compare(normalizedPassword, AUTH.FAKE_PASSWORD_HASH);
    logger.warn('Tentativa de login com email inexistente.', {
      email: normalizedEmail,
    });
    throw new AppError('Credenciais inválidas.', 401);
  }

  if (user.isBlocked && user.blockExpires && user.blockExpires < now) {
    user = await userRepository.unlockUser(user.id);
  }

  if (user.isBlocked && user.blockExpires && user.blockExpires > now) {
    logger.warn('Tentativa de login em conta bloqueada.', { userId: user.id });
    throw new AppError('Conta temporariamente bloqueada.', 403);
  }

  if (!user.emailVerified) {
    logger.warn('Tentativa de login com e-mail não verificado.', {
      userId: user.id,
      email: normalizedEmail,
    });
    throw new AppError('Verifique seu e-mail antes de realizar o login.', 403);
  }

  const isPasswordValid = await bcrypt.compare(
    normalizedPassword,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    logger.warn('Senha inválida.', { userId: user.id, email: normalizedEmail });
    const attempts = await userRepository.incrementLoginAttempts(user.id);
    if (attempts.loginAttempts >= AUTH.MAX_LOGIN_ATTEMPTS) {
      const blockExpires = new Date(
        now.getTime() + AUTH.VERIFICATION_WINDOW_MS,
      );

      await userRepository.blockUser(user.id, blockExpires);

      logger.warn('Usuário bloqueado por excesso de tentativas.', {
        userId: user.id,
        loginAttempts: attempts.loginAttempts,
      });
      throw new AppError(
        'Acesso temporariamente bloqueado por excesso de tentativas.',
        403,
      );
    }

    throw new AppError('Credenciais inválidas.', 401);
  }

  try {
    await verificationService.sendUserCode(user, VerificationType.LOGIN);
  } catch (error) {
    logger.error('Erro ao tentar enviar código', {
      userId: user.id,
      error: error.message,
    });
    throw new AppError(
      'Erro interno ao tentar enviar código, tente novamente.',
      500,
    );
  }

  await userRepository.resetLoginAttempts(user.id);

  logger.info('Código enviado com sucesso.', { userId: user.id });

  return {
    message: 'Código enviado com sucesso, verifique seu e-mail.',
  };
};

const finalizeLogin = async (verificationToken) => {
  if (!verificationToken) {
    throw new AppError('Token não informado.', 400);
  }

  const decoded =
    await verificationService.verifyVerificationToken(verificationToken);

  if (decoded.type !== VerificationType.LOGIN) {
    throw new AppError('Tipo de verificação inválido.', 400);
  }

  let user;
  let session;

  try {
    user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    await userRepository.updateLastLogin(user.id, new Date());

    session = await tokenService.createSession(user);
  } catch (error) {
    logger.error('Erro ao tentar fazer login.', {
      userId: decoded.userId,
      error: error.message,
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erro interno ao tentar fazer login.', 500);
  }

  return {
    message: 'Login realizado com sucesso.',
    ...session,
    user,
  };
};

const logoutUserService = async (accessToken, refreshToken) => {
  if (!accessToken) {
    throw new AppError('Token não informado.', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  const accessTokenHash = generateHash(accessToken);

  const expiresAt = new Date(decoded.exp * 1000);

  try {
    await revokedTokenRepository.createRevokedToken(accessTokenHash, expiresAt);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      logger.warn('Token já está na blacklist.');
    } else {
      throw error;
    }
  }
  if (refreshToken) {
    const refreshTokenHash = generateHash(refreshToken);

    await refreshTokenRepository.deleteByTokenHash(refreshTokenHash);
  }

  logger.info('Logout realizado com sucesso.', { userId: decoded.id });

  return { message: 'Logout realizado com sucesso.' };
};

const refreshTokenService = async (token) => {
  const decoded = await tokenService.verifyRefreshToken(token);

  const tokenHash = generateHash(token);

  await refreshTokenRepository.deleteByTokenHash(tokenHash);

  const user = await userRepository.findTokenValidationData(decoded.id);

  if (!user) {
    throw new AppError('Usuário não encontrado.', 401);
  }

  if (user.isBlocked === true) {
    throw new AppError('Usuário bloqueado.', 403);
  }

  return await tokenService.createSession(user);
};

const forgotPasswordService = async (email) => {
  if (!email) {
    throw new AppError('Dados inválidos.', 400);
  }

  const normalizedEmail = normalizeEmail(email);

  const user = await userRepository.findByEmail(normalizedEmail);

  if (user) {
    try {
      await verificationService.sendUserCode(
        user,
        VerificationType.PASSWORD_RESET,
      );
    } catch (error) {
      logger.error('Erro ao enviar código de verificação.', {
        userId: user.id,
        error: error.message,
      });
      throw new AppError('Erro interno ao enviar código de verificação.', 500);
    }
  }

  return { message: 'Se o e-mail existir, um código foi enviado.' };
};

const resetPasswordService = async (verificationToken, newPassword) => {
  if (!verificationToken || !newPassword) {
    throw new AppError('Dados inválidos.', 400);
  }

  const decoded =
    await verificationService.verifyVerificationToken(verificationToken);

  if (decoded.type !== VerificationType.PASSWORD_RESET) {
    throw new AppError('Tipo de verificação inválido.', 400);
  }

  try {
    const newPasswordHash = await bcrypt.hash(
      newPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );

    await userRepository.updatePassword(decoded.userId, newPasswordHash);

    await refreshTokenRepository.deleteByUserId(decoded.userId);

    return { message: 'Senha redefinida com sucesso.' };
  } catch (error) {
    logger.error('Erro ao redefinir senha.', {
      userId: decoded.userId,
      error: error.message,
    });
    throw new AppError('Falha interna ao redefinir senha.', 500);
  }
};

const changePasswordService = async (userId, currentPassword, newPassword) => {
  if (!userId || !currentPassword || !newPassword) {
    throw new AppError('Dados inválidos.', 400);
  }

  try {
    const user = await userRepository.findPasswordHash(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const passwordHashValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!passwordHashValid) {
      throw new AppError('Senha atual incorreta.', 401);
    }

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      AUTH.BCRYPT_SALT_ROUNDS,
    );

    await userRepository.updatePassword(userId, newPasswordHash);

    await refreshTokenRepository.deleteByUserId(userId);

    return { message: 'Senha alterada com sucesso.' };
  } catch (error) {
    logger.error('Erro ao alterar senha.', {
      userId,
      error: error.message,
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Falha interna ao alterar senha.', 500);
  }
};

const getUserProfile = async (userId) => {
  if (!userId) {
    throw new AppError('Dados inválidos.', 400);
  }

  let user;

  try {
    user = await userRepository.findProfileData(userId);
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário.', {
      userId,
      error: error.message,
    });
    throw new AppError('Erro interno ao buscar perfil.', 500);
  }

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  const userAge = user.birthDate ? age.calculateAge(user.birthDate) : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    userAge,
  };
};

module.exports = {
  registerUserService,
  verifyEmailService,
  startLogin,
  finalizeLogin,
  resendCodeService,
  logoutUserService,
  refreshTokenService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  getUserProfile,
};
