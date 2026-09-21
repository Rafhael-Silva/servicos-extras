const rateLimit = require('express-rate-limit');

const authServiceLimit = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: {
    message:
      'Muitas requisições solicitadas ao Auth-Service. Por favor, tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const userServiceLimit = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 60,
  message: {
    message:
      'Muitas requisições solicitadas ao User-Service. Por favor, tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authServiceLimit,
  userServiceLimit,
};
