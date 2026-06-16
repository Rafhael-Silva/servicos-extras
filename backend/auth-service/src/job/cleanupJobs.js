const prisma = require('../config/prisma');
const logger = require('../config/logger');

const cleanupRevokedTokens = async () => {
  try {
    const currentDate = new Date();
    const deleteTokens = await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: {
          lt: currentDate,
        },
      },
    });
    logger.info(`${deleteTokens.count} tokens revogados expirados removidos.`);
  } catch (error) {
    logger.error('Falha ao deletar tokens revogados.', {
      error: error.message,
    });
  }
};

const cleanupRefreshTokens = async () => {
  try {
    const currentDate = new Date();
    const deleteTokens = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: currentDate,
        },
      },
    });
    logger.info(`${deleteTokens.count} refresh tokens expirados removidos.`);
  } catch (error) {
    logger.error('Falha ao deletar refresh tokens.', { error: error.message });
  }
};

const cleanupVerificationCodes = async () => {
  try {
    const currentDate = new Date();
    const deleteCodes = await prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: currentDate,
        },
      },
    });
    logger.info(`${deleteCodes.count} códigos expirados removidos.`);
  } catch (error) {
    logger.error('Falha ao deletar códigos.', { error: error.message });
  }
};

module.exports = {
  cleanupRevokedTokens,
  cleanupRefreshTokens,
  cleanupVerificationCodes,
};
