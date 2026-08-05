const request = require('supertest');
let mockUser = {
  id: 'user123',
  role: 'CANDIDATO',
};
jest.mock('../../src/middlewares/authenticateToken', () => {
  const authenticateToken = (req, res, next) => {
    req.user = mockUser;
    return next();
  };
  return authenticateToken;
});
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');
const path = require('path');
const { CurriculumType } = require('@prisma/client');
const uploadFile = require('../../src/services/uploadFileService');
const deleteFile = require('../../src/services/deleteFileService');

const profileUser = (overrides = {}) => ({
  phone: '34987564231',
  bio: 'Fake bio',
  city: 'Poços de Caldas',
  state: 'MG',
  ...overrides,
});

const curriculumData = (overrides = {}) => ({
  professionalSummary: 'Fake Summary',
  experiences: 'Fake experience',
  educations: 'Fake education',
  courses: 'Fake course',
  skills: 'Fake Skill',
  observations: 'Fake observation',
  ...overrides,
});

const imagePath = path.join(__dirname, '..', 'fixtures', 'image-test.jpg');
const curriculumPdfPath = path.join(
  __dirname,
  '..',
  'fixtures',
  'curriculum-test.pdf',
);
const curriculumDocxPath = path.join(
  __dirname,
  '..',
  'fixtures',
  'curriculum-test.docx',
);
const invalidFilePath = path.join(__dirname, '..', 'fixtures', 'fake-test.txt');

describe('userRoutes - POST/profile', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.userProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test.only('deve criar um perfil de usuário com foto.', async () => {
    const profileData = profileUser();

    const response = await request(app)
      .post('/api/user/profile')
      .field(profileData)
      .attach('photo', imagePath);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      phone: profileData.phone,
      photoKey: 'profiles/user123/image-test.jpg',
      bio: profileData.bio,
      city: profileData.city,
      state: profileData.state,
    });
  });
  test.only('deve criar um perfil de usuário sem foto.', async () => {
    mockUser = {
      id: 'user123',
      role: 'RECRUTADOR',
    };
    const profileData = profileUser();

    const response = await request(app)
      .post('/api/user/profile')
      .field(profileData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      phone: profileData.phone,
      photoKey: null,
      bio: profileData.bio,
      city: profileData.city,
      state: profileData.state,
    });
  });
});
