const userService = require('../services/userService');
const logger = require('../config/logger');
const AppError = require('../../errors/AppError');

const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const buffer = req.file?.buffer;
    const fileName = req.file?.originalname;
    const profileData = req.body;

    const result = await userService.createProfileService(
      userId,
      buffer,
      fileName,
      profileData,
    );

    return res.status(201).json(result);
  } catch (error) {
    logger.error('Erro ao criar perfil do usuário.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const buffer = req.file?.buffer;
    const fileName = req.file?.originalname;
    const profileData = req.body;

    const result = await userService.updateProfileService(
      userId,
      buffer,
      fileName,
      profileData,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao atualizar perfil do usuário.', {
      error: error.message,
    });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const result = await userService.getMeService(userId, role);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário.', { error: error.message });
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
    const candidateId = req.params.userId;
    const role = req.user.role;

    const result = await userService.getProfileService(candidateId, role);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário.', { error: error.message });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const uploadCurriculum = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const buffer = req.file?.buffer;
    const fileName = req.file?.originalname;

    const result = await userService.uploadCurriculumService(
      userId,
      role,
      buffer,
      fileName,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao enviar currículo do usuário.', {
      error: error.message,
    });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const createPlatformCurriculum = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const curriculumData = req.body;

    const result = await userService.createPlatformCurriculumService(
      userId,
      role,
      curriculumData,
    );

    return res.status(201).json(result);
  } catch (error) {
    logger.error('Erro ao criar currículo do usuário.', {
      error: error.message,
    });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const updatePlatformCurriculum = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const curriculumData = req.body;

    const result = await userService.updatePlatformCurriculumService(
      userId,
      role,
      curriculumData,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao atualizar currículo do usuário.', {
      error: error.message,
    });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = {
  createProfile,
  updateProfile,
  me,
  getProfile,
  uploadCurriculum,
  createPlatformCurriculum,
  updatePlatformCurriculum,
};
