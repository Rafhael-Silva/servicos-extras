const express = require('express');
const router = express.Router();
const { authenticateToken, upload, validateSchema } = require('../middlewares');
const {
  personProfileSchema,
  curriculumPersonSchema,
  companyProfileSchema,
} = require('../utils/validations');
const personController = require('../controllers/personController');
const companyController = require('../controllers/companyController');

// Criar, atualizar e buscar perfil do usuário
router.post(
  '/person',
  authenticateToken,
  upload.single('photo'),
  validateSchema(personProfileSchema),
  personController.createProfile,
);
router.put(
  '/person',
  authenticateToken,
  upload.single('photo'),
  validateSchema(personProfileSchema),
  personController.updateProfile,
);
router.get('/person/me', authenticateToken, personController.myProfile);
router.get(
  '/person/:personId',
  authenticateToken,
  personController.publicProfile,
);

// Upload, criar e atualizar curriculo
router.put(
  '/curriculum/upload',
  authenticateToken,
  upload.single('curriculum'),
  personController.uploadCurriculum,
);
router.post(
  '/curriculum',
  authenticateToken,
  validateSchema(curriculumPersonSchema),
  personController.createPlatformCurriculum,
);
router.put(
  '/curriculum',
  authenticateToken,
  validateSchema(curriculumPersonSchema),
  personController.updatePlatformCurriculum,
);

// Criar, atualizar e buscar perfil da empresa
router.post(
  '/company',
  authenticateToken,
  upload.single('logo'),
  validateSchema(companyProfileSchema),
  companyController.createProfile,
);
router.put(
  '/company',
  authenticateToken,
  upload.single('logo'),
  validateSchema(companyProfileSchema),
  companyController.updateProfile,
);
router.get('/company/me', authenticateToken, companyController.myProfile);
router.get(
  '/company/:companyId',
  authenticateToken,
  companyController.publicProfile,
);

module.exports = router;
