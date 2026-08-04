const AUTH = require('../constants/auth');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: AUTH.REFRESH_TOKEN_MAX_AGE,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', cookieOptions);
};

module.exports = {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
