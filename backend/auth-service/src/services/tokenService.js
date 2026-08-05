const { refreshTokenRepository } = require('../repositories');
const logger = require('../config/logger');
const AppError = require('../../errors/AppError');
const jwt = require('jsonwebtoken');
const { generateHash, generateToken } = require('../utils');
const AUTH = require('../constants/auth');

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

  const tokenHash = generateHash(token);

  try {
    await refreshTokenRepository.createRefreshToken(
      userId,
      tokenHash,
      expiresAt,
    );
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

  const tokenHash = generateHash(token);

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    logger.warn('Falha na verificação do refresh token.', {
      error: error.message,
    });
    throw new AppError('Token de atualização inválido ou expirado.', 401);
  }

  const existingToken = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!existingToken || existingToken.expiresAt < new Date()) {
    logger.warn('Token de atualização inválido ou expirado.', {
      userId: decoded.id,
    });
    throw new AppError('Token de atualização inválido ou expirado.', 401);
  }

  return decoded;
};

const createSession = async (user) => {
  const accessToken = generateToken.generateAccessToken({
    id: user.id,
    accountType: user.accountType,
  });

  const refreshToken = generateToken.generateRefreshToken({
    id: user.id,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_EXPIRES_DAYS);

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

module.exports = {
  storeRefreshToken,
  verifyRefreshToken,
  createSession,
};
