const AppError = require('../../errors/AppError');
const {
  verificationCodeRepository,
  userRepository,
} = require('../repositories');
const { logger } = require('../config');
const emailService = require('./emailService');
const { generateHash, normalizeEmail, generateToken } = require('../utils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AUTH = require('../constants/auth');

const sendUserCode = async (user, type) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - AUTH.VERIFICATION_WINDOW_MS);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  const recentCodeCount =
    await verificationCodeRepository.countRecentValidCodes(
      user.id,
      type,
      now,
      windowStart,
    );

  if (recentCodeCount >= 5) {
    logger.warn('Limite de envio de código atingido.', { userId: user.id });
    throw new AppError(
      'Aguarde alguns minutos antes de solicitar um novo código.',
      429,
    );
  }

  const code = crypto.randomInt(100000, 1000000).toString();

  const codeHash = generateHash(code);

  const expiresAt = new Date(now.getTime() + AUTH.VERIFICATION_CODE_EXPIRES_MS);

  await verificationCodeRepository.replaceVerificationCode(
    user.id,
    type,
    codeHash,
    now,
    expiresAt,
  );

  try {
    await emailService.sendVerificationCode(user.email, code);
  } catch (error) {
    logger.error('Erro ao enviar código de verificação.', {
      userId: user.id,
      error: error.message,
    });

    throw new AppError('Erro interno ao enviar código de verificação.', 500);
  }

  logger.info('Código enviado.', { userId: user.id, type });

  return { message: 'Código enviado com sucesso.' };
};

const verifyUserCode = async (email, code, type) => {
  if (!email || !code || !type) {
    throw new AppError('Dados inválidos', 400);
  }

  const now = new Date();
  const normalizedEmail = normalizeEmail(email);

  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  await verificationCodeRepository.deleteExpiredCodes(user.id, now);

  const record = await verificationCodeRepository.findLatestValidCode(
    user.id,
    type,
    now,
  );

  if (!record) {
    logger.warn('Código inválido informado.', { userId: user.id });
    throw new AppError('Código inválido ou expirado.', 400);
  }

  const codeHash = generateHash(code);

  if (codeHash !== record.codeHash) {
    const attempts = await verificationCodeRepository.incrementCodeAttempts(
      record.id,
    );
    if (attempts.attempts >= 5) {
      await verificationCodeRepository.markCodeAsUsed(record.id);
      logger.warn('Limite de tentativas excedido.', {
        userId: user.id,
        type,
      });
      throw new AppError(
        'Muitas tentativas inválidas. Solicite um novo código.',
        429,
      );
    }
    logger.warn('Tentativa de código inválido.', { userId: user.id, type });
    throw new AppError('Código inválido ou expirado.', 400);
  }

  const updated = await verificationCodeRepository.consumeCode(record.id);

  if (updated.count === 0) {
    logger.warn('Código já utilizado.', { userId: user.id });
    throw new AppError('Código inválido ou expirado.', 400);
  }

  const verificationToken = generateToken.generateVerificationToken({
    userId: user.id,
    type,
  });

  logger.info('Código validado com sucesso.', { userId: user.id });

  return { verificationToken, message: 'Código validado com sucesso.' };
};

const verifyVerificationToken = (token) => {
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

module.exports = {
  sendUserCode,
  verifyUserCode,
  verifyVerificationToken,
};
