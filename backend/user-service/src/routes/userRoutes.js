const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const upload = require('../middlewares/upload');
const validateSchema = require('../middlewares/validateSchema');
const {
  profileUserSchema,
  curriculumUserSchema,
} = require('../utils/validations');
const userController = require('../controllers/userController');

// Criar, atualizar e buscar perfil do usuário
router.post(
  '/profile',
  authenticateToken,
  upload.single('photo'),
  validateSchema(profileUserSchema),
  userController.createProfile,
);
router.put(
  '/profile',
  authenticateToken,
  upload.single('photo'),
  validateSchema(profileUserSchema),
  userController.updateProfile,
);
router.get('/me', authenticateToken, userController.me);
router.get('/profile/:userId', authenticateToken, userController.getProfile);

// Upload, criar e atualizar curriculo
router.put(
  '/curriculum/upload',
  authenticateToken,
  upload.single('curriculum'),
  userController.uploadCurriculum,
);
router.post(
  '/curriculum',
  authenticateToken,
  validateSchema(curriculumUserSchema),
  userController.createPlatformCurriculum,
);
router.put(
  '/curriculum',
  authenticateToken,
  validateSchema(curriculumUserSchema),
  userController.updatePlatformCurriculum,
);

module.exports = router;
