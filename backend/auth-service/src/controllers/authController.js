const authService = require('../services/authService');
const { verificationService } = require('../services');
const { asyncHandler } = require('../middlewares');
const { cookies } = require('../utils');

const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    accountType,
    cpf,
    cnpj,
    termsAccepted,
    birthDate,
  } = req.body;

  const response = await authService.registerUserService({
    name,
    email,
    password,
    accountType,
    cpf,
    cnpj,
    termsAccepted,
    birthDate,
  });

  res.status(201).json(response);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  const { refreshToken, ...response } =
    await authService.verifyEmailService(verificationToken);

  cookies.setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json(response);
});

const resendCode = asyncHandler(async (req, res) => {
  const { email, type } = req.body;

  const response = await authService.resendCodeService(email, type);

  return res.status(200).json(response);
});

const verifyUserCode = asyncHandler(async (req, res) => {
  const { email, code, type } = req.body;

  const response = await verificationService.verifyUserCode(email, code, type);

  return res.status(200).json(response);
});

const startLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const response = await authService.startLogin(email, password);

  return res.status(200).json(response);
});

const finalizeLogin = asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  const { refreshToken, ...response } =
    await authService.finalizeLogin(verificationToken);

  cookies.setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json(response);
});

const logoutUser = asyncHandler(async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies.refreshToken;

  const response = await authService.logoutUserService(
    accessToken,
    refreshToken,
  );

  cookies.clearRefreshTokenCookie(res);

  return res.status(200).json(response);
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Refresh token inválido ou não fornecido.' });
  }
  const { refreshToken, accessToken } =
    await authService.refreshTokenService(token);

  cookies.setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json({ accessToken });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const response = await authService.forgotPasswordService(email);

  return res.status(200).json(response);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { verificationToken, newPassword } = req.body;

  const response = await authService.resetPasswordService(
    verificationToken,
    newPassword,
  );

  return res.status(200).json(response);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const response = await authService.changePasswordService(
    userId,
    currentPassword,
    newPassword,
  );

  return res.status(200).json(response);
});

const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const response = await authService.getUserProfile(userId);

  return res.status(200).json(response);
});

module.exports = {
  registerUser,
  verifyEmail,
  resendCode,
  verifyUserCode,
  startLogin,
  finalizeLogin,
  logoutUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
};
