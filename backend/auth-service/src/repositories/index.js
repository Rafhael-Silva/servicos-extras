const userRepository = require('./userRepository');
const verificationCodeRepository = require('./verificationCodeRepository');
const refreshTokenRepository = require('./refreshTokenRepository');
const revokedTokenRepository = require('./revokedTokenRepository');

module.exports = {
  userRepository,
  verificationCodeRepository,
  refreshTokenRepository,
  revokedTokenRepository,
};
