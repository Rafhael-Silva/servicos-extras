const prisma = require('../config/prisma');
const { CurriculumType } = require('@prisma/client');
const uploadFile = require('./uploadFileService');
const deleteFile = require('./deleteFileService');
const AppError = require('../../errors/AppError');
const logger = require('../config/logger');

const createProfileService = async (userId, buffer, fileName, profileData) => {
  if (!userId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const profileExists = await prisma.userProfile.findUnique({
    where: { authUserId: userId },
    select: { authUserId: true },
  });

  if (profileExists) {
    logger.warn('Tentativa de criar perfil já existente.', { userId });
    throw new AppError('Usuário já possui perfil cadastrado.', 409);
  }

  const { phone, bio, city, state } = profileData;

  let newPhotoKey = null;

  if (buffer && fileName) {
    const key = `profiles/${userId}/${fileName}`;
    newPhotoKey = await uploadFile(buffer, key);
  }

  const newProfile = await prisma.userProfile.create({
    data: {
      authUserId: userId,
      phone,
      photoKey: newPhotoKey,
      bio,
      city,
      state,
    },
    select: {
      authUserId: true,
      phone: true,
      photoKey: true,
      bio: true,
      city: true,
      state: true,
    },
  });

  logger.info('Perfil criado com sucesso.', { userId });

  return newProfile;
};

const updateProfileService = async (userId, buffer, fileName, profileData) => {
  if (!userId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const profileExists = await prisma.userProfile.findUnique({
    where: { authUserId: userId },
    select: { authUserId: true, photoKey: true },
  });

  if (!profileExists) {
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  const { phone, bio, city, state } = profileData;

  const data = {
    phone,
    bio,
    city,
    state,
  };

  if (buffer && fileName) {
    if (profileExists.photoKey) {
      await deleteFile(profileExists.photoKey);
    }
    const key = `profiles/${userId}/${fileName}`;
    const newPhotoKey = await uploadFile(buffer, key);

    data.photoKey = newPhotoKey;
  }

  const updatedProfile = await prisma.userProfile.update({
    where: { authUserId: userId },
    data,
    select: {
      authUserId: true,
      phone: true,
      photoKey: true,
      bio: true,
      city: true,
      state: true,
    },
  });

  logger.info('Perfil atualizado com sucesso.', { userId });

  return updatedProfile;
};

const getMeService = async (userId, role) => {
  if (!userId || !role) {
    throw new AppError('Dados inválidos.', 400);
  }

  const isCandidato = role === 'CANDIDATO';

  const profile = await prisma.userProfile.findUnique({
    where: { authUserId: userId },
    select: {
      phone: true,
      photoKey: true,
      bio: isCandidato,
      city: true,
      state: true,
      curriculum: isCandidato,
    },
  });

  if (!profile) {
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  return profile;
};

const getProfileService = async (candidateId, role) => {
  if (!candidateId || !role) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (role !== 'RECRUTADOR') {
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const profile = await prisma.userProfile.findUnique({
    where: { authUserId: candidateId },
    select: {
      phone: true,
      photoKey: true,
      bio: true,
      city: true,
      state: true,
      curriculum: true,
    },
  });

  if (!profile) {
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  return profile;
};

const uploadCurriculumService = async (userId, role, buffer, fileName) => {
  if (!userId || !role || !buffer || !fileName) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (role !== 'CANDIDATO') {
    logger.warn('Usuário sem permissão para upload.', { userId, role });
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const curriculumExist = await prisma.curriculum.findUnique({
    where: { userId },
    select: { fileKey: true },
  });

  if (curriculumExist?.fileKey) {
    await deleteFile(curriculumExist.fileKey);
  }

  const key = `curriculums/${userId}/${fileName}`;
  const fileKey = await uploadFile(buffer, key);

  const uploadedCurriculum = await prisma.curriculum.upsert({
    where: { userId },
    update: {
      type: CurriculumType.UPLOAD,
      fileKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    },
    create: {
      userId,
      type: CurriculumType.UPLOAD,
      fileKey,
    },
  });

  logger.info('Currículo enviado com sucesso.', { userId });

  return uploadedCurriculum;
};

const createPlatformCurriculumService = async (
  userId,
  role,
  curriculumData,
) => {
  if (!userId || !role || !curriculumData) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (role !== 'CANDIDATO') {
    logger.warn('Usuário sem permissão para criar currículo.', {
      userId,
      role,
    });
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const {
    professionalSummary,
    experiences,
    educations,
    courses,
    skills,
    observations,
  } = curriculumData;

  const curriculumExist = await prisma.curriculum.findUnique({
    where: { userId },
    select: { fileKey: true },
  });

  if (curriculumExist?.fileKey) {
    await deleteFile(curriculumExist.fileKey);
  }

  const createCurriculum = await prisma.curriculum.upsert({
    where: { userId },
    update: {
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary,
      experiences,
      educations,
      courses,
      skills,
      observations,
    },
    create: {
      userId,
      type: CurriculumType.PLATFORM,
      professionalSummary,
      experiences,
      educations,
      courses,
      skills,
      observations,
    },
  });

  logger.info('Currículo criado com sucesso.', { userId });

  return createCurriculum;
};

const updatePlatformCurriculumService = async (
  userId,
  role,
  curriculumData,
) => {
  if (!userId || !role || !curriculumData) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (role !== 'CANDIDATO') {
    logger.warn('Usuário sem permissão para atualizar currículo.', {
      userId,
      role,
    });
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const {
    professionalSummary,
    experiences,
    educations,
    courses,
    skills,
    observations,
  } = curriculumData;

  const curriculumExist = await prisma.curriculum.findUnique({
    where: { userId },
    select: { type: true },
  });

  if (!curriculumExist) {
    throw new AppError('Currículo não encontrado.', 404);
  }

  if (curriculumExist.type !== CurriculumType.PLATFORM) {
    throw new AppError('Este tipo de currículo não aceita atualizações.', 400);
  }

  const updatedCurriculum = await prisma.curriculum.update({
    where: { userId },
    data: {
      professionalSummary,
      experiences,
      educations,
      courses,
      skills,
      observations,
    },
  });

  logger.info('Currículo atualizado com sucesso.', { userId });

  return updatedCurriculum;
};

module.exports = {
  createProfileService,
  updateProfileService,
  getMeService,
  getProfileService,
  uploadCurriculumService,
  createPlatformCurriculumService,
  updatePlatformCurriculumService,
};
