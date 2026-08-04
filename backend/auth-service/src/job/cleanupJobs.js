const {
  revokedTokenRepository,
  refreshTokenRepository,
  verificationCodeRepository,
} = require('../repositories');
const { logger } = require('../config');

const cleanupRevokedTokens = async () => {
  try {
    const deletedTokens = await revokedTokenRepository.cleanupRevokedTokens();
    logger.info(`${deletedTokens.count} tokens revogados expirados removidos.`);
  } catch (error) {
    logger.error('Falha ao deletar tokens revogados.', {
      error: error.message,
    });
  }
};

const cleanupRefreshTokens = async () => {
  try {
    const deletedTokens = await refreshTokenRepository.cleanupRefreshTokens();
    logger.info(`${deletedTokens.count} refresh tokens expirados removidos.`);
  } catch (error) {
    logger.error('Falha ao deletar refresh tokens.', { error: error.message });
  }
};

const cleanupVerificationCodes = async () => {
  try {
    const deletedCodes =
      await verificationCodeRepository.cleanupVerificationCodes();
    logger.info(`${deletedCodes.count} códigos expirados removidos.`);
  } catch (error) {
    logger.error('Falha ao deletar códigos.', { error: error.message });
  }
};

module.exports = {
  cleanupRevokedTokens,
  cleanupRefreshTokens,
  cleanupVerificationCodes,
};
