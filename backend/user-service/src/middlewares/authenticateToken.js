const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token de autenticação ausente ou mal formatado.',
      });
    }

    const accessToken = header.split(' ')[1];

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

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
