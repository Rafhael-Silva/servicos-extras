const companyService = require('../services/companyService');
const { asyncHandler } = require('../middlewares');

const createProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const fileData = req.file;
  const { profileData, addressData } = req.body;

  const response = await companyService.createProfileService(
    authUserId,
    fileData,
    profileData,
    addressData,
  );

  return res.status(201).json(response);
});

const updateProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const fileData = req.file;
  const { profileData, addressData } = req.body;

  const response = await companyService.updateProfileService(
    authUserId,
    fileData,
    profileData,
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
  updateProfile,
  myProfile,
  publicProfile,
};
