const nodeCron = require('node-cron');
const {
  cleanupRevokedTokens,
  cleanupRefreshTokens,
  cleanupVerificationCodes,
} = require('./cleanupJobs');
const { logger } = require('../config');

const startCleanupJobs = () => {
  const cron =
    process.env.NODE_ENV === 'development' ? '* * * * *' : '0 * * * *';

  nodeCron.schedule(cron, async () => {
    await Promise.all([
      cleanupRevokedTokens(),
      cleanupRefreshTokens(),
      cleanupVerificationCodes(),
    ]);
  });

  logger.info('Cleanup jobs iniciados.');
};

module.exports = startCleanupJobs;
