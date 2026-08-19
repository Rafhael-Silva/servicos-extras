const {
  personProfileRepository,
  personAddressRepository,
  curriculumRepository,
} = require('../repositories');
const { CurriculumType } = require('@prisma/client');
const uploadFile = require('../storage/uploadFile');
const deleteFile = require('../storage/deleteFile');
const AppError = require('../../errors/AppError');
const logger = require('../config/logger');

const createProfileService = async (authUserId, profileData, addressData) => {
  if (!authUserId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const existingProfile =
    await personProfileRepository.findByAuthUserId(authUserId);

  if (existingProfile) {
    logger.warn('Tentativa de criar perfil já existente.', { authUserId });
    throw new AppError('Usuário já possui perfil cadastrado.', 409);
  }

  const { phone, bio } = profileData;
  const { street, number, complement, neighborhood, city, state, zipCode } =
    addressData;

  const dataProfile = {
    authUserId,
    phone,
    bio,
  };

  const dataAddress = {
    personId: authUserId,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
  };

  const personProfile = await personProfileRepository.create(dataProfile);

  const personAddress = await personAddressRepository.create(dataAddress);

  logger.info('Perfil do usuário criado com sucesso.', {
    authUserId,
  });

  return {
    ...personProfile,
    address: personAddress,
  };
};

const uploadPhotoService = async (authUserId, fileData) => {
  if (!authUserId || !fileData) {
    throw new AppError('Dados inválidos.', 400);
  }

  const existingProfile =
    await personProfileRepository.findByAuthUserId(authUserId);

  if (!existingProfile) {
    logger.warn('Perfil do usuário não encontrado.', { authUserId });
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  if (existingProfile.photoKey) {
    await deleteFile(existingProfile.photoKey);
  }

  const { buffer, originalname } = fileData;

  const key = `person-profiles/${authUserId}/${originalname}`;
  const photoKey = await uploadFile(buffer, key);

  const updatedProfilePhoto = await personProfileRepository.updatePhoto(
    authUserId,
    photoKey,
  );

  logger.info('Foto do usuário carregada com sucesso.', { authUserId });

  return updatedProfilePhoto;
};

const updateProfileService = async (authUserId, profileData, addressData) => {
  if (!authUserId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const personProfile =
    await personProfileRepository.findByAuthUserId(authUserId);

  if (!personProfile) {
    logger.warn('Perfil do usuário não encontrado.', { authUserId });
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  const { phone, bio } = profileData;
  const { street, number, complement, neighborhood, city, state, zipCode } =
    addressData;

  const dataProfile = {
    phone,
    bio,
  };

  const dataAddress = {
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
  };

  const updatedPersonProfile = await personProfileRepository.update(
    authUserId,
    dataProfile,
  );
  const updatedPersonAddress = await personAddressRepository.update(
    authUserId,
    dataAddress,
  );

  logger.info('Perfil do usuário atualizado com sucesso.', { authUserId });

  return {
    ...updatedPersonProfile,
    address: updatedPersonAddress,
  };
};

const getMyProfileService = async (authUserId, accountType) => {
  if (!authUserId || !accountType) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (accountType !== 'PERSON') {
    logger.warn('Usuário não possui permissão', { authUserId, accountType });
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const myProfile = await personProfileRepository.getMyProfile(authUserId);

  if (!myProfile) {
    logger.warn('Perfil do usuário não encontrado.', { authUserId });
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  logger.info('Perfil do usuário encontrado com sucesso.', { authUserId });

  return myProfile;
};

const getPublicProfileService = async (authUserId, personId) => {
  if (!authUserId || !personId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const publicProfile =
    await personProfileRepository.getPublicProfile(personId);

  if (!publicProfile) {
    logger.warn('Perfil do usuário não encontrado.', { authUserId, personId });
    throw new AppError('Perfil do usuário não encontrado.', 404);
  }

  logger.info('Perfil do usuário encontrado com sucesso.', {
    authUserId,
    personId,
  });

  return publicProfile;
};

const uploadCurriculumService = async (authUserId, accountType, fileData) => {
  if (!authUserId || !accountType || !fileData) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (accountType !== 'PERSON') {
    logger.warn('Usuário sem permissão para upload.', {
      authUserId,
      accountType,
    });
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const existingCurriculum =
    await curriculumRepository.findByPersonId(authUserId);

  if (existingCurriculum?.fileKey) {
    await deleteFile(existingCurriculum.fileKey);
  }

  const { buffer, originalname } = fileData;

  const key = `curriculums/${authUserId}/${originalname}`;
  const fileKey = await uploadFile(buffer, key);

  const data = {
    personId: authUserId,
    type: CurriculumType.UPLOAD,
    fileKey,
    professionalSummary: null,
    experiences: null,
    educations: null,
    courses: null,
    skills: null,
    observations: null,
  };

  const uploadedCurriculum = await curriculumRepository.upsert(data);

  logger.info('Currículo enviado com sucesso.', { authUserId });

  return uploadedCurriculum;
};

const createPlatformCurriculumService = async (
  authUserId,
  accountType,
  curriculumData,
) => {
  if (!authUserId || !accountType || !curriculumData) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (accountType !== 'PERSON') {
    logger.warn('Usuário sem permissão para criar currículo.', {
      authUserId,
      accountType,
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

  const existingCurriculum =
    await curriculumRepository.findByPersonId(authUserId);

  if (existingCurriculum?.fileKey) {
    await deleteFile(existingCurriculum.fileKey);
  }

  const dataCurriculum = {
    personId: authUserId,
    type: CurriculumType.PLATFORM,
    fileKey: null,
    professionalSummary,
    experiences,
    educations,
    courses,
    skills,
    observations,
  };

  const platformCurriculum = await curriculumRepository.upsert(dataCurriculum);

  logger.info('Currículo criado com sucesso.', { authUserId });

  return platformCurriculum;
};

const updatePlatformCurriculumService = async (
  authUserId,
  accountType,
  curriculumData,
) => {
  if (!authUserId || !accountType || !curriculumData) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (accountType !== 'PERSON') {
    logger.warn('Usuário sem permissão para atualizar currículo.', {
      authUserId,
      accountType,
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

  const existingCurriculum =
    await curriculumRepository.findByPersonId(authUserId);

  if (!existingCurriculum) {
    logger.warn('Currículo não encontrado.', { authUserId });
    throw new AppError('Currículo não encontrado.', 404);
  }

  if (existingCurriculum.type !== CurriculumType.PLATFORM) {
    logger.warn('Tipo de currículo diferente.', { authUserId });
    throw new AppError('Este tipo de currículo não aceita atualizações.', 400);
  }

  const dataCurriculum = {
    professionalSummary,
    experiences,
    educations,
    courses,
    skills,
    observations,
  };

  const updatedCurriculum = await curriculumRepository.update(
    authUserId,
    dataCurriculum,
  );

  logger.info('Currículo atualizado com sucesso.', { authUserId });

  return updatedCurriculum;
};

module.exports = {
  createProfileService,
  uploadPhotoService,
  updateProfileService,
  getMyProfileService,
  getPublicProfileService,
  uploadCurriculumService,
  createPlatformCurriculumService,
  updatePlatformCurriculumService,
};
