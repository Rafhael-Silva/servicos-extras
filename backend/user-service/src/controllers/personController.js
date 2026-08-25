const personService = require('../services/personService');
const { asyncHandler } = require('../middlewares');

const createProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const { profileData, addressData } = req.body;

  const response = await personService.createProfileService(
    authUserId,
    profileData,
    addressData,
  );

  return res.status(201).json(response);
});

const uploadPhoto = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const fileData = req.file;

  const response = await personService.uploadPhotoService(authUserId, fileData);

  return res.status(200).json(response);
});

const updateProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const { profileData, addressData } = req.body;

  const response = await personService.updateProfileService(
    authUserId,
    profileData,
    addressData,
  );

  return res.status(200).json(response);
});

const myProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const accountType = req.user.accountType;

  const response = await personService.getMyProfileService(
    authUserId,
    accountType,
  );

  return res.status(200).json(response);
});

const publicProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const personId = req.params.personId;

  const response = await personService.getPublicProfileService(
    authUserId,
    personId,
  );

  return res.status(200).json(response);
});

const uploadCurriculum = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const accountType = req.user.accountType;
  const fileData = req.file;

  const response = await personService.uploadCurriculumService(
    authUserId,
    accountType,
    fileData,
  );

  return res.status(200).json(response);
});

const createPlatformCurriculum = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const accountType = req.user.accountType;
  const curriculumData = req.body;

  const response = await personService.createPlatformCurriculumService(
    authUserId,
    accountType,
    curriculumData,
  );

  return res.status(201).json(response);
});

const updatePlatformCurriculum = asyncHandler(async (req, res) => {
  const authUserId = req.user.id;
  const accountType = req.user.accountType;
  const curriculumData = req.body;

  const response = await personService.updatePlatformCurriculumService(
    authUserId,
    accountType,
    curriculumData,
  );

  return res.status(200).json(response);
});

module.exports = {
  createProfile,
  uploadPhoto,
  updateProfile,
  myProfile,
  publicProfile,
  uploadCurriculum,
  createPlatformCurriculum,
  updatePlatformCurriculum,
};
