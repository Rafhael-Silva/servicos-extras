const jwt = require('jsonwebtoken');

//Payload esperado (id e accountType)
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
};

//Payload esperado (id)
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

//Payload esperado (userId e type)
const generateVerificationToken = (payload) => {
  return jwt.sign(payload, process.env.VERIFICATION_TOKEN_SECRET, {
    expiresIn: '5m',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
};
