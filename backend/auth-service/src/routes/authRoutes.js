const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  registerUserSchema,
  startLoginSchema,
  finalizeLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resendCodeSchema,
  verifyUserCodeSchema,
  verifyEmailSchema,
} = require('../utils/validations');
const {
  authenticateToken,
  validateSchema,
  rateLimit,
} = require('../middlewares');

// Cadastro
router.post(
  '/register',
  validateSchema(registerUserSchema),
  authController.registerUser,
);
router.post(
  '/verify-email',
  rateLimit.verifyEmailLimiter,
  validateSchema(verifyEmailSchema),
  authController.verifyEmail,
);

// Reenvio de código
router.post(
  '/resend-code',
  rateLimit.sendCodeLimiter,
  validateSchema(resendCodeSchema),
  authController.resendCode,
);

//Verificação de código
router.post(
  '/verify-code',
  rateLimit.verifyUserCodeLimiter,
  validateSchema(verifyUserCodeSchema),
  authController.verifyUserCode,
);

// Login
router.post(
  '/start-login',
  rateLimit.loginLimiter,
  validateSchema(startLoginSchema),
  authController.startLogin,
);
router.post(
  '/finalize-login',
  rateLimit.loginLimiter,
  validateSchema(finalizeLoginSchema),
  authController.finalizeLogin,
);

// Fazer Logout
router.post('/logout', authenticateToken, authController.logoutUser);

// Renovar token
router.post('/refresh-token', authController.refreshToken);

// Recuperação de senha
router.post(
  '/forgot-password',
  rateLimit.forgotPasswordLimiter,
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  validateSchema(resetPasswordSchema),
  authController.resetPassword,
);

// Trocar senha
router.patch(
  '/change-password',
  authenticateToken,
  validateSchema(changePasswordSchema),
  authController.changePassword,
);

// Perfil
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
