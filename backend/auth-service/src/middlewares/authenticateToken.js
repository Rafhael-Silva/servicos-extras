const jwt = require('jsonwebtoken');
const { generateHash } = require('../utils');
const { revokedTokenRepository, userRepository } = require('../repositories');

const authenticateToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token de autenticação ausente ou mal formatado.',
      });
    }

    const accessToken = header.split(' ')[1];

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const accessTokenHash = generateHash(accessToken);

    const revokedToken =
      await revokedTokenRepository.findByTokenHash(accessTokenHash);

    if (revokedToken) {
      return res.status(401).json({
        message: 'Token revogado. Faça login novamente.',
      });
    }

    const user = await userRepository.findBlockStatus(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'Usuário não encontrado.',
      });
    }

    if (
      user.isBlocked &&
      (!user.blockExpires || user.blockExpires > new Date())
    ) {
      return res.status(403).json({
        message: 'Usuário bloqueado.',
      });
    }

    req.user = {
      id: decoded.id,
      accountType: decoded.accountType,
    };

    return next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        message:
          error.name === 'TokenExpiredError'
            ? 'Token expirado.'
            : 'Token inválido.',
      });
    }

    return next(error);
  }
};

module.exports = authenticateToken;
