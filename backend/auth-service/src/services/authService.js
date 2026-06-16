const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Prisma, VerificationType, UserRole } = require('@prisma/client');
const prisma = require('../config/prisma');
const logger = require('../config/logger');
const AppError = require('../../errors/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
} = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

const fake_hash =
  '$2b$10$Wyxrd9PPA0qYX4jkcrG7w.VWhf4HWbvYCGFyjcHYGESuaqDiPHqE.';
const timeMin = 15 * 60 * 1000;

const emailExists = async (email) => {
  if (!email) {
    throw new AppError('Dado inválido.', 400);
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  return await prisma.user.findUnique({ where: { email: normalizedEmail } });
};

const cpfExists = async (cpf) => {
  if (!cpf) {
    throw new AppError('Dado inválido.', 400);
  }
  const normalizedCpf = String(cpf).trim();
  return await prisma.user.findUnique({ where: { cpf: normalizedCpf } });
};

const cnpjExists = async (cnpj) => {
  if (!cnpj) {
    throw new AppError('Dado inválido.', 400);
  }
  const normalizedCnpj = String(cnpj).trim();
  return await prisma.user.findUnique({ where: { cnpj: normalizedCnpj } });
};

const isUserUnderage = (birthDate) => {
  const birth = new Date(birthDate);
  if (isNaN(birth)) throw new AppError('Data inválida.', 400);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  return (
    age < 18 ||
    (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
  );
};

const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  if (isNaN(birth)) throw new AppError('Data inválida.', 400);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

const sendUserCode = async (user, type) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeMin);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  const countCod = await prisma.verificationCode.count({
    where: {
      userId: user.id,
      type: type,
      used: false,
      expiresAt: { gt: now },
      createdAt: { gte: windowStart },
    },
  });

  if (countCod >= 5) {
    logger.warn('Limite de envio de código atingido.', { userId: user.id });
    throw new AppError(
      'Aguarde alguns minutos antes de solicitar um novo código.',
      429,
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const text = `Seu código de verificação é: ${code}`;

  const html = `
        <p>Você está recebendo um código de verificação.</p>
        <p><strong>Código: ${code}</strong></p>
        <p>Este código expira em 10 minutos.</p>
      `;

  await prisma.$transaction([
    prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type: type,
        used: false,
        expiresAt: { gt: now },
      },
    }),
    prisma.verificationCode.create({
      data: {
        userId: user.id,
        codeHash,
        type,
        expiresAt,
        attempts: 0,
        used: false,
      },
    }),
  ]);

  await sendEmail(user.email, 'Seu código de verificação', text, html);

  logger.info('Código enviado.', { userId: user.id, type });

  return { message: 'Código enviado com sucesso.' };
};

const resendCodeService = async (email, type) => {
  if (!email || !type) {
    throw new AppError('Dados inválidos', 400);
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  await sendUserCode(user, type);

  return { message: 'Código reenviado. Verifique seu e-mail.' };
};

const verifyUserCode = async (email, code, type) => {
  if (!email || !code) {
    throw new AppError('Dados inválidos', 400);
  }

  const now = new Date();
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  await prisma.verificationCode.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: now },
    },
  });

  const record = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      type,
      expiresAt: { gt: now },
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    logger.warn('Código inválido informado.', { userId: user.id });
    throw new AppError('Código inválido ou expirado.', 400);
  }

  if (record.attempts >= 5) {
    await prisma.verificationCode.update({
      where: {
        id: record.id,
      },
      data: {
        used: true,
      },
    });
    logger.warn('Excesso de tentativas.', { userId: user.id });
    throw new AppError('Código inválido ou expirado.', 429);
  }

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  if (codeHash !== record.codeHash) {
    logger.warn('Tentativa de código inválido.', { userId: user.id, type });
    const attempts = await prisma.verificationCode.update({
      where: {
        id: record.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
      select: { attempts: true },
    });
    if (attempts.attempts >= 5) {
      await prisma.verificationCode.update({
        where: {
          id: record.id,
        },
        data: {
          used: true,
        },
      });
    }
    throw new AppError('Código inválido ou expirado.', 400);
  }

  const updated = await prisma.verificationCode.updateMany({
    where: {
      id: record.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  if (updated.count === 0) {
    logger.warn('Código já utilizado.', { userId: user.id });
    throw new AppError('Código inválido ou expirado.', 400);
  }

  logger.info('Código validado com sucesso.', { userId: user.id });

  const verificationToken = generateVerificationToken({
    userId: user.id,
    type,
  });

  return { verificationToken, message: 'Código validado com sucesso.' };
};

const verifyVerificationToken = async (token) => {
  if (!token) {
    throw new AppError('Token não informado.', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
  } catch (error) {
    logger.warn('Falha na verificação do token.', {
      error: error.message,
    });
    throw new AppError('Token inválido ou expirado.', 401);
  }

  return decoded;
};

const createUser = async ({
  name,
  email,
  passwordHash,
  role,
  cpf,
  cnpj,
  termsAccepted,
  birthDate,
}) => {
  if (!role || !Object.values(UserRole).includes(role.toUpperCase())) {
    throw new AppError('Tipo de usuário inválido.', 400);
  }
  const normalizedRole = role.toUpperCase();
  const newUser = await prisma.user.create({
    data: {
      name,
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      cpf,
      cnpj: normalizedRole === 'RECRUTADOR' ? cnpj : undefined,
      termsAccepted,
      birthDate: new Date(birthDate),
    },
  });

  return newUser;
};

const registerUserService = async ({
  name,
  email,
  passwordHash,
  role,
  cpf,
  cnpj,
  termsAccepted,
  birthDate,
}) => {
  const user = await createUser({
    name,
    email,
    passwordHash,
    role,
    cpf,
    cnpj,
    termsAccepted,
    birthDate,
  });

  try {
    await sendUserCode(user, VerificationType.EMAIL_VERIFICATION);
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

  const decoded = await verifyVerificationToken(verificationToken);

  if (decoded.type !== 'EMAIL_VERIFICATION') {
    throw new AppError('Tipo de verificação inválido.', 400);
  }

  let user;
  let accessToken;
  let refreshToken;

  try {
    user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        emailVerified: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    accessToken = generateAccessToken({ id: user.id, role: user.role });

    refreshToken = generateRefreshToken({ id: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await storeRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });
  } catch (error) {
    logger.error('Erro ao verificar e-mail e fazer login.', {
      userId: decoded.userId,
      error: error.message,
    });
    throw new AppError('Erro interno ao concluir verificação do e-mail.', 500);
  }

  try {
    await sendWelcomeEmail(user.name, user.email);
  } catch (error) {
    logger.error('Falha ao enviar e-mail de boas-vindas:', {
      userId: decoded.userId,
      error: error.message,
    });
  }

  return {
    message: 'E-mail verificado e login realizado com sucesso.',
    accessToken,
    refreshToken,
    user,
  };
};

const startLogin = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Dados inválidos', 400);
  }

  const now = new Date();
  const block_time = new Date(now.getTime() + timeMin);
  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedPassword = String(password);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      emailVerified: true,
      role: true,
      isBlocked: true,
      loginAttempts: true,
      blockExpires: true,
    },
  });

  if (!user) {
    await bcrypt.compare(normalizedPassword, fake_hash);
    logger.warn('Tentativa de login com email inexistente.', {
      email: normalizedEmail,
    });
    throw new AppError('Credenciais inválidas.', 401);
  }

  if (user.isBlocked && user.blockExpires && user.blockExpires < now) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
      },
    });

    user.isBlocked = false;
    user.loginAttempts = 0;
    user.blockExpires = null;
  }

  if (user.isBlocked && user.blockExpires && user.blockExpires > now) {
    logger.warn('Tentativa de login em conta bloqueada.', { userId: user.id });
    throw new AppError(
      'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
      403,
    );
  }

  if (user.emailVerified === false) {
    throw new AppError('Credenciais inválidas.', 403);
  }

  const isPasswordValid = await bcrypt.compare(
    normalizedPassword,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    logger.warn('Senha inválida.', { userId: user.id, email: normalizedEmail });
    const attempts = await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: {
          increment: 1,
        },
      },
      select: { loginAttempts: true },
    });
    if (attempts.loginAttempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isBlocked: true,
          blockExpires: block_time,
        },
      });

      logger.warn('Usuário bloqueado por excesso de tentativas.', {
        userId: user.id,
      });
      throw new AppError(
        'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
        403,
      );
    }

    throw new AppError('Credenciais inválidas.', 401);
  }

  try {
    await sendUserCode(user, VerificationType.LOGIN);
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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      isBlocked: false,
      blockExpires: null,
    },
  });

  logger.info('Código enviado com sucesso.', { userId: user.id });

  return {
    message: 'Código enviado com sucesso, verifique seu e-mail.',
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const finalizeLogin = async (verificationToken) => {
  if (!verificationToken) {
    throw new AppError('Token não informado.', 400);
  }

  const decoded = await verifyVerificationToken(verificationToken);

  if (decoded.type !== 'LOGIN') {
    throw new AppError('Tipo de verificação inválido.', 400);
  }

  let accessToken;
  let refreshToken;
  let user;

  try {
    user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, role: true, email: true },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    accessToken = generateAccessToken({ id: user.id, role: user.role });

    refreshToken = generateRefreshToken({ id: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await storeRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    const now = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });
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
    accessToken,
    refreshToken,
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

  const accessTokenHash = crypto
    .createHash('sha256')
    .update(accessToken)
    .digest('hex');

  const expiresAt = new Date(decoded.exp * 1000);

  try {
    await prisma.revokedToken.create({
      data: {
        tokenHash: accessTokenHash,
        expiresAt,
      },
    });
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
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await prisma.refreshToken.deleteMany({
      where: { tokenHash: refreshTokenHash },
    });
  }

  logger.info('Logout realizado com sucesso.', { userId: decoded.id });

  return { message: 'Logout realizado com sucesso.' };
};

const storeRefreshToken = async ({ userId, token, expiresAt }) => {
  if (
    !userId ||
    !token ||
    !(expiresAt instanceof Date) ||
    isNaN(expiresAt.getTime())
  ) {
    logger.warn('Dados inválidos ao armazenar refresh token.', { userId });
    throw new AppError('Dados inválidos.', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  } catch (error) {
    logger.error('Erro ao armazenar refresh token.', {
      userId,
      error: error.message,
    });
    throw new AppError('Erro interno ao armazenar refresh token.', 500);
  }
};

const verifyRefreshToken = async (token) => {
  if (!token) {
    throw new AppError('Token não informado.', 401);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    logger.warn('Falha na verificação do refresh token.', {
      tokenHash,
      error: error.message,
    });
    throw new AppError('Token de atualização inválido ou expirado.', 401);
  }

  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  const now = new Date();

  if (!existingToken || existingToken.expiresAt < now) {
    logger.warn('Token de atualização inválido ou expirado.', {
      userId: decoded.id,
      tokenHash,
    });
    throw new AppError('Token de atualização inválido ou expirado.', 401);
  }

  return decoded;
};

const refreshTokenService = async (token) => {
  const decoded = await verifyRefreshToken(token);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await prisma.refreshToken.deleteMany({
    where: { tokenHash },
  });

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      role: true,
      isBlocked: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado.', 401);
  }

  if (user.isBlocked === true) {
    throw new AppError('Usuário bloqueado.', 401);
  }

  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await storeRefreshToken({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const forgotPasswordService = async (email) => {
  if (!email) {
    throw new AppError('Dado inválido.', 400);
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (user) {
    try {
      await sendUserCode(user, VerificationType.PASSWORD_RESET);
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

const resetPasswordService = async (verificationToken, newPasswordHash) => {
  if (!verificationToken || !newPasswordHash) {
    throw new AppError('Dados inválidos.', 400);
  }

  const decoded = await verifyVerificationToken(verificationToken);

  if (decoded.type !== 'PASSWORD_RESET') {
    throw new AppError('Tipo de verificação inválido.', 400);
  }

  try {
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: decoded.userId },
    });

    return { message: 'Senha redefinida com sucesso.' };
  } catch (error) {
    logger.error('Erro ao redefinir senha.', {
      userId: decoded.userId,
      error: error.message,
    });
    throw new AppError('Falha interna ao redefinir senha.', 500);
  }
};

const changePasswordService = async (
  userId,
  currentPassword,
  newPasswordHash,
) => {
  if (!userId || !currentPassword || !newPasswordHash) {
    throw new AppError('Dados inválidos.', 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

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

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

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

const getUserDocument = (user) => {
  if (user.role === UserRole.CANDIDATO) {
    return { cpf: user.cpf };
  }
  if (user.role === UserRole.RECRUTADOR) {
    if (user.cnpj) {
      return { cnpj: user.cnpj };
    } else if (user.cpf) {
      return { cpf: user.cpf };
    }
  }

  return {};
};

const getUserProfile = async (userId) => {
  if (!userId) {
    throw new AppError('Dados inválidos.', 400);
  }

  let user;

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        birthDate: true,
        cpf: true,
        cnpj: true,
      },
    });
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

  const age = user.birthDate ? calculateAge(user.birthDate) : null;
  const document = getUserDocument(user);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    age,
    ...document,
  };
};

module.exports = {
  emailExists,
  cpfExists,
  cnpjExists,
  isUserUnderage,
  calculateAge,
  createUser,
  registerUserService,
  verifyEmailService,
  startLogin,
  finalizeLogin,
  sendUserCode,
  resendCodeService,
  verifyUserCode,
  verifyVerificationToken,
  logoutUserService,
  storeRefreshToken,
  verifyRefreshToken,
  refreshTokenService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  getUserDocument,
  getUserProfile,
};
