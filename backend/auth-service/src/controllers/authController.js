const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const logger = require('../config/logger');
const AppError = require('../../errors/AppError');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, cpf, cnpj, termsAccepted, birthDate } =
      req.body;

    if (await authService.isUserUnderage(birthDate)) {
      return res.status(400).json({
        message: 'Você deve ter 18 anos ou mais para se cadastrar.',
      });
    }

    if (await authService.emailExists(email)) {
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    if (cpf && (await authService.cpfExists(cpf))) {
      return res.status(409).json({ message: 'CPF já cadastrado.' });
    }

    if (cnpj && (await authService.cnpjExists(cnpj))) {
      return res.status(409).json({ message: 'CNPJ já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const payload = {
      name,
      email,
      passwordHash,
      role,
      cpf,
      cnpj,
      termsAccepted,
      birthDate,
    };

    await authService.registerUserService(payload);

    return res.status(201).json({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });
  } catch (error) {
    logger.error('Erro no cadastro.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { verificationToken } = req.body;

    const result = await authService.verifyEmailService(verificationToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro na verificação do e-mail.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const resendCode = async (req, res) => {
  try {
    const { email, type } = req.body;

    const result = await authService.resendCodeService(email, type);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro na solicitação do código.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const verifyUserCode = async (req, res) => {
  try {
    const { email, code, type } = req.body;

    const result = await authService.verifyUserCode(email, code, type);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro na verificação do código.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const startLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.startLogin(email, password);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro no login.', { error: error.message });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const finalizeLogin = async (req, res) => {
  try {
    const { verificationToken } = req.body;

    const result = await authService.finalizeLogin(verificationToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao fazer login.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const logoutUser = async (req, res) => {
  try {
    const accessToken = req.headers.authorization.split(' ')[1];
    const refreshToken = req.cookies.refreshToken;

    const result = await authService.logoutUserService(
      accessToken,
      refreshToken,
    );

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao fazer logout.', { error: error.message });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Refresh token inválido ou não fornecido.' });
    }
    const result = await authService.refreshTokenService(token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    logger.error('Erro ao renovar token.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPasswordService(email);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao recuperar senha.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Erro interno no servidor.',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { verificationToken, newPassword } = req.body;

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const result = await authService.resetPasswordService(
      verificationToken,
      newPasswordHash,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao redefinir senha.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Erro interno no servidor.',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const result = await authService.changePasswordService(
      userId,
      currentPassword,
      newPasswordHash,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao redefinir senha.', { error: error.message });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userProfile = await authService.getUserProfile(userId);

    return res.status(200).json(userProfile);
  } catch (error) {
    logger.error('Erro ao encontrar perfil de usuário.', {
      error: error.message,
    });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Erro interno no servidor.',
    });
  }
};

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
