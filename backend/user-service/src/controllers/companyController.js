const companyService = require('../services/companyService');
const { asyncHandler } = require('../middlewares');

const createProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const { companyData, addressData } = req.body;

  const response = await companyService.createProfileService(
    authUserId,
    companyData,
    addressData,
  );

  return res.status(201).json(response);
});

const uploadLogo = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const fileData = req.file;

  const response = await companyService.uploadLogoService(authUserId, fileData);

  return res.status(200).json(response);
});

const updateProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const { companyData, addressData } = req.body;

  const response = await companyService.updateProfileService(
    authUserId,
    companyData,
    addressData,
  );

  return res.status(200).json(response);
});

const myProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const accountType = req.user.accountType;

  const response = await companyService.getMyProfileService(
    authUserId,
    accountType,
  );

  return res.status(200).json(response);
});

const publicProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const companyId = req.params.companyId;

  const response = await companyService.getPublicProfileService(
    authUserId,
    companyId,
  );

  return res.status(200).json(response);
});

module.exports = {
  createProfile,
  uploadLogo,
  updateProfile,
  myProfile,
  publicProfile,
};
