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
  loginLimiter,
  forgotPasswordLimiter,
  sendCodeLimiter,
  verifyUserCodeLimiter,
  verifyEmailLimiter,
} = require('../middlewares/rateLimit');
const authenticateToken = require('../middlewares/authenticateToken');
const validateSchema = require('../middlewares/validateSchema');

// Cadastro
router.post(
  '/register',
  validateSchema(registerUserSchema),
  authController.registerUser,
);
router.post(
  '/verify-email',
  verifyEmailLimiter,
  validateSchema(verifyEmailSchema),
  authController.verifyEmail,
);

// Reenvio de código
router.post(
  '/resend-code',
  sendCodeLimiter,
  validateSchema(resendCodeSchema),
  authController.resendCode,
);

//Verificação de código
router.post(
  '/verify-code',
  verifyUserCodeLimiter,
  validateSchema(verifyUserCodeSchema),
  authController.verifyUserCode,
);

// Login
router.post(
  '/start-login',
  loginLimiter,
  validateSchema(startLoginSchema),
  authController.startLogin,
);
router.post(
  '/finalize-login',
  loginLimiter,
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
  forgotPasswordLimiter,
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
