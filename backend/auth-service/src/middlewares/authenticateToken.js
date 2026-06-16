const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');

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

    const accessTokenHash = crypto
      .createHash('sha256')
      .update(accessToken)
      .digest('hex');

    const revokedToken = await prisma.revokedToken.findUnique({
      where: { tokenHash: accessTokenHash },
    });

    if (revokedToken) {
      return res.status(401).json({
        message: 'Token revogado. Faça login novamente.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        isBlocked: true,
        blockExpires: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Usuário não encontrado.',
      });
    }

    const now = new Date();

    if (user?.isBlocked && user.blockExpires > now) {
      return res.status(403).json({
        message: 'Usuário bloqueado.',
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
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

    return res.status(500).json({
      message: 'Ocorreu um erro inesperado no servidor.',
    });
  }
};

module.exports = authenticateToken;
