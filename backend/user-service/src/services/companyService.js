const {
  companyProfileRepository,
  companyAddressRepository,
} = require('../repositories');
const uploadFile = require('../storage/uploadFile');
const deleteFile = require('../storage/deleteFile');
const AppError = require('../../errors/AppError');
const logger = require('../config/logger');

const createProfileService = async (authUserId, companyData, addressData) => {
  if (!authUserId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const existingProfile =
    await companyProfileRepository.findByAuthUserId(authUserId);

  if (existingProfile) {
    logger.warn('Tentativa de criar perfil já existente.', { authUserId });
    throw new AppError('Empresa já possui perfil cadastrado.', 409);
  }

  const { companyName, phone, bio } = companyData;
  const { street, number, complement, neighborhood, city, state, zipCode } =
    addressData;

  const dataCompany = {
    authUserId,
    companyName,
    phone,
    bio,
  };

  const dataAddress = {
    companyId: authUserId,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
  };

  const companyProfile = await companyProfileRepository.create(dataCompany);

  const companyAddress = await companyAddressRepository.create(dataAddress);

  logger.info('Perfil da empresa criado com sucesso.', { authUserId });

  return {
    ...companyProfile,
    address: companyAddress,
  };
};

const uploadLogoService = async (authUserId, fileData) => {
  if (!authUserId || !fileData) {
    throw new AppError('Dados inválidos.', 400);
  }

  const existingProfile =
    await companyProfileRepository.findByAuthUserId(authUserId);

  if (!existingProfile) {
    logger.warn('Empresa não encontrada.', { authUserId });
    throw new AppError('Perfil da empresa não encontrado.', 404);
  }

  if (existingProfile.logoKey) {
    await deleteFile(existingProfile.logoKey);
  }

  const { buffer, originalname } = fileData;

  const key = `company-profiles/${authUserId}/${originalname}`;
  const logoKey = await uploadFile(buffer, key);

  const updatedProfileLogo = await companyProfileRepository.updateLogo(
    authUserId,
    logoKey,
  );

  logger.info('Logo da empresa carregada com sucesso.', { authUserId });

  return updatedProfileLogo;
};

const updateProfileService = async (authUserId, companyData, addressData) => {
  if (!authUserId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const companyProfile =
    await companyProfileRepository.findByAuthUserId(authUserId);

  if (!companyProfile) {
    logger.warn('Empresa não encontrada.', { authUserId });
    throw new AppError('Perfil da empresa não encontrado.', 404);
  }

  const { companyName, phone, bio } = companyData;
  const { street, number, complement, neighborhood, city, state, zipCode } =
    addressData;

  const dataCompany = {
    companyName,
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

  const updatedCompanyProfile = await companyProfileRepository.update(
    authUserId,
    dataCompany,
  );

  const updatedCompanyAddress = await companyAddressRepository.update(
    authUserId,
    dataAddress,
  );

  logger.info('Perfil da empresa atualizado com sucesso.', { authUserId });

  return {
    ...updatedCompanyProfile,
    address: updatedCompanyAddress,
  };
};

const getMyProfileService = async (authUserId, accountType) => {
  if (!authUserId || !accountType) {
    throw new AppError('Dados inválidos.', 400);
  }

  if (accountType !== 'COMPANY') {
    logger.warn('Usuário não possui permissão.', { authUserId, accountType });
    throw new AppError('Usuário não possui permissão.', 403);
  }

  const myProfile = await companyProfileRepository.getMyProfile(authUserId);

  if (!myProfile) {
    logger.warn('Perfil da empresa não encontrado.', { authUserId });
    throw new AppError('Perfil da empresa não encontrado.', 404);
  }

  logger.info('Perfil da empresa encontrado com sucesso.', { authUserId });

  return myProfile;
};

const getPublicProfileService = async (authUserId, companyId) => {
  if (!authUserId || !companyId) {
    throw new AppError('Dados inválidos.', 400);
  }

  const publicProfile =
    await companyProfileRepository.getPublicProfile(companyId);

  if (!publicProfile) {
    logger.warn('Perfil da empresa não encontrado.', { authUserId, companyId });
    throw new AppError('Perfil da empresa não encontrado.', 404);
  }

  logger.info('Perfil da empresa encontrado com sucesso.', {
    authUserId,
    companyId,
  });

  return publicProfile;
};

module.exports = {
  createProfileService,
  uploadLogoService,
  updateProfileService,
  getMyProfileService,
  getPublicProfileService,
};
