const request = require('supertest');
let mockUser = {
  id: 'user123',
  accountType: 'PERSON',
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

const personProfile = (overrides = {}) => ({
  phone: '34987564231',
  bio: 'Fake bio',
  ...overrides,
});
const companyProfile = (overrides = {}) => ({
  companyName: 'Empresa',
  phone: '34987564231',
  bio: 'Fake bio',
  ...overrides,
});
const userAddress = (overrides = {}) => ({
  street: 'Rua A',
  number: '65',
  complement: null,
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'FK',
  zipCode: '23453137',
  ...overrides,
});
const dataCurriculum = (overrides = {}) => ({
  professionalSummary: 'Fake Summary',
  experiences: [
    {
      company: 'Empresa',
      role: 'Cargo',
      startDate: '02/2000',
      endDate: '09/2003',
      description: 'fake',
    },
  ],
  educations: [
    {
      institution: 'instituição',
      course: 'Curso',
      completionYear: 2006,
    },
  ],
  courses: [
    {
      name: 'Nome do curso',
      workLoad: '60 horas',
    },
  ],
  skills: ['Fake Skill'],
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

describe('userRoutes - POST/person', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve criar um perfil de usuário com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      phone: profileData.phone,
      bio: profileData.bio,
      address: {
        personId: mockUser.id,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
      },
    });
  });
  test('deve retornar 400 quando profileData não for enviado.', async () => {
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/person')
      .send({ addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do perfil do usuário são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do profileData não for enviado.', async () => {
    const profileData = personProfile({
      phone: undefined,
    });
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['O campo telefone é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando addressData não for enviado.', async () => {
    const profileData = personProfile();

    const response = await request(app)
      .post('/api/user/person')
      .send({ profileData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do endereço do usuário são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do addressData não for enviado.', async () => {
    const profileData = personProfile();
    const addressData = userAddress({
      street: undefined,
    });

    const response = await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['O campo rua é obrigatório.'],
    });
  });
  test('deve retornar 409 quando usuário já possuir um perfil.', async () => {
    const dataProfileExist = personProfile();
    const dataAddressExist = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData: dataProfileExist, addressData: dataAddressExist });

    const profileData = personProfile();
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: 'Usuário já possui perfil cadastrado.',
    });
  });
});

describe('userRoutes - PUT/person/photo', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve fazer upload da foto do usuário com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    const response = await request(app)
      .put('/api/user/person/photo')
      .attach('photo', imagePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      photoKey: `person-profiles/${mockUser.id}/image-test.jpg`,
    });
  });
  test('deve retornar 400 quando os dados do upload forem inválidos.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    const response = await request(app)
      .put('/api/user/person/photo')
      .attach('photo', undefined);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Dados inválidos.' });
  });
  test('deve retornar 404 quando o perfil do usuário não for encontrado.', async () => {
    const response = await request(app)
      .put('/api/user/person/photo')
      .attach('photo', imagePath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil do usuário não encontrado.',
    });
  });
});

describe('userRoutes - PUT/person', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve atualizar o perfil do usuário com sucesso.', async () => {
    const firstProfile = personProfile();
    const firstAdress = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData: firstProfile, addressData: firstAdress });

    const profileData = personProfile({
      bio: null,
    });
    const addressData = userAddress({
      street: 'Rua atualizada',
      complement: 'Atualizado',
    });

    const response = await request(app)
      .put('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      phone: profileData.phone,
      bio: profileData.bio,
      address: {
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
      },
    });
  });
  test('deve retornar 400 quando profileData não for enviado.', async () => {
    const addressData = userAddress();

    const response = await request(app)
      .put('/api/user/person')
      .send({ addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do perfil do usuário são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do profileData não for enviado.', async () => {
    const profileData = personProfile({
      phone: undefined,
      bio: 'Atualizado',
    });
    const addressData = userAddress();

    const response = await request(app)
      .put('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['O campo telefone é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando addressData não for enviado.', async () => {
    const profileData = personProfile();

    const response = await request(app)
      .put('/api/user/person')
      .send({ profileData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do endereço do usuário são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do addressData não for enviado.', async () => {
    const profileData = personProfile();
    const addressData = userAddress({
      street: undefined,
      complement: 'Atualizado',
    });

    const response = await request(app)
      .put('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['O campo rua é obrigatório.'],
    });
  });
  test('deve retornar 404 quando o perfil do usuário não for encontrado.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    const response = await request(app)
      .put('/api/user/person')
      .send({ profileData, addressData });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil do usuário não encontrado.',
    });
  });
});

describe('userRoutes - GET/person/me', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'PERSON',
    };

    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve buscar o perfil do usuário com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumPdfPath);

    const response = await request(app).get('/api/user/person/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      phone: profileData.phone,
      photoKey: null,
      bio: profileData.bio,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      address: {
        personId: mockUser.id,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      curriculum: {
        personId: mockUser.id,
        type: CurriculumType.UPLOAD,
        fileKey: 'curriculums/user123/curriculum-test.pdf',
        professionalSummary: null,
        experiences: null,
        educations: null,
        courses: null,
        skills: null,
        observations: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
  test('deve retornar 403 quando accountType for diferente de PERSON', async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    const response = await request(app).get('/api/user/person/me');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Usuário não possui permissão.' });
  });
  test('deve retornar 404 quando o perfil do usuário não for encontrado.', async () => {
    const response = await request(app).get('/api/user/person/me');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil do usuário não encontrado.',
    });
  });
});

describe('userRoutes - GET/person/personId', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'person123',
      accountType: 'PERSON',
    };

    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve buscar o perfil do usuário com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumPdfPath);

    mockUser = {
      id: 'company123',
      accountType: 'COMPANY',
    };

    const response = await request(app).get('/api/user/person/person123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      photoKey: null,
      bio: profileData.bio,
      address: {
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      },
      curriculum: {
        type: CurriculumType.UPLOAD,
        fileKey: 'curriculums/person123/curriculum-test.pdf',
        professionalSummary: null,
        experiences: null,
        educations: null,
        courses: null,
        skills: null,
        observations: null,
      },
    });
  });
  test('deve retornar 404 quando o perfil do usuário não for encontrado.', async () => {
    mockUser = {
      id: 'company123',
      accountType: 'COMPANY',
    };

    const response = await request(app).get('/api/user/person/person123');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil do usuário não encontrado.',
    });
  });
});

describe('userRoutes - PUT/curriculum/upload', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'PERSON',
    };

    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve fazer upload do currículo com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    const response = await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumDocxPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      personId: mockUser.id,
      type: CurriculumType.UPLOAD,
      fileKey: 'curriculums/user123/curriculum-test.docx',
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
  test('deve retornar 400 quando o tipo do arquivo for inválido.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    const response = await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', invalidFilePath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message:
        'Tipo de arquivo inválido. Apenas PDF, DOC, DOCX, JPEG e PNG são permitidos!',
    });
  });
  test('deve retornar 403 quando accountType for diferente de PERSON.', async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    const response = await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumPdfPath);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Usuário não possui permissão.' });
  });
  test('deve substituir um currículo do tipo PLATFORM por um currículo do tipo UPLOAD.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();
    const curriculumData = dataCurriculum({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
    });

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    await request(app).post('/api/user/curriculum').send(curriculumData);

    const response = await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumDocxPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      personId: mockUser.id,
      type: CurriculumType.UPLOAD,
      fileKey: 'curriculums/user123/curriculum-test.docx',
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});

describe('userRoutes - POST/curriculum', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'PERSON',
    };

    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve criar um currículo pela plataforma com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();
    const curriculumData = dataCurriculum({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
    });

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    const response = await request(app)
      .post('/api/user/curriculum')
      .send(curriculumData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: curriculumData.professionalSummary,
      experiences: curriculumData.experiences,
      educations: curriculumData.educations,
      courses: curriculumData.courses,
      skills: curriculumData.skills,
      observations: curriculumData.observations,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
  test('deve retornar 403 quando accountType for diferente de PERSON.', async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    const curriculumData = dataCurriculum({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
    });

    const response = await request(app)
      .post('/api/user/curriculum')
      .send(curriculumData);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Usuário não possui permissão.' });
  });
  test('deve substituir um currículo do tipo UPLOAD por um currículo do tipo PLATFORM', async () => {
    const profileData = personProfile();
    const addressData = userAddress();
    const curriculumData = dataCurriculum({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
    });

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumPdfPath);

    const response = await request(app)
      .post('/api/user/curriculum')
      .send(curriculumData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: curriculumData.professionalSummary,
      experiences: curriculumData.experiences,
      educations: curriculumData.educations,
      courses: curriculumData.courses,
      skills: curriculumData.skills,
      observations: curriculumData.observations,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});

describe('userRoutes - PUT/curriculum', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'PERSON',
    };

    jest.clearAllMocks();

    await prisma.personProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve atualizar um currículo pela plataforma com sucesso.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();
    const firstCurriculum = dataCurriculum({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
      experiences: null,
      courses: null,
    });
    const curriculumData = dataCurriculum();

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    await request(app).post('/api/user/curriculum').send(firstCurriculum);

    const response = await request(app)
      .put('/api/user/curriculum')
      .send(curriculumData);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      professionalSummary: curriculumData.professionalSummary,
      experiences: curriculumData.experiences,
      educations: curriculumData.educations,
      courses: curriculumData.courses,
      skills: curriculumData.skills,
      observations: curriculumData.observations,
    });
  });
  test('deve retornar 403 quando accountType for diferente de PERSON.', async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    const curriculumData = dataCurriculum();

    const response = await request(app)
      .put('/api/user/curriculum')
      .send(curriculumData);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Usuário não possui permissão.' });
  });
  test('deve retornar 400 quando tipo de currículo for diferente de PLATFORM.', async () => {
    const profileData = personProfile();
    const addressData = userAddress();
    const curriculumData = dataCurriculum({
      personId: mockUser.id,
      type: CurriculumType.PLATFORM,
    });

    await request(app)
      .post('/api/user/person')
      .send({ profileData, addressData });

    await request(app)
      .put('/api/user/curriculum/upload')
      .attach('curriculum', curriculumPdfPath);

    const response = await request(app)
      .put('/api/user/curriculum')
      .send(curriculumData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Este tipo de currículo não aceita atualizações.',
    });
  });
});

describe('userRoutes - POST/company', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    jest.clearAllMocks();

    await prisma.companyProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve criar um perfil de empresa com sucesso.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      companyName: companyData.companyName,
      phone: companyData.phone,
      bio: companyData.bio,
      address: {
        companyId: mockUser.id,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
      },
    });
  });
  test('deve retornar 400 quando companyData não for enviado.', async () => {
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/company')
      .send({ addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do perfil da empresa são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do companyData não for enviado.', async () => {
    const companyData = companyProfile({
      companyName: undefined,
    });
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['O campo nome da empresa é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando addressData não for enviado.', async () => {
    const companyData = companyProfile();

    const response = await request(app)
      .post('/api/user/company')
      .send({ companyData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do endereço da empresa são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do addressData não for enviado.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress({
      city: undefined,
    });

    const response = await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['O campo cidade é obrigatório.'],
    });
  });
  test('deve retornar 409 quando a empresa já possuir um perfil.', async () => {
    const dataProfileExist = companyProfile();
    const dataAddressExist = userAddress();

    await request(app)
      .post('/api/user/company')
      .send({ companyData: dataProfileExist, addressData: dataAddressExist });

    const companyData = companyProfile();
    const addressData = userAddress();

    const response = await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: 'Empresa já possui perfil cadastrado.',
    });
  });
});

describe('userRoutes - PUT/company/logo', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    jest.clearAllMocks();

    await prisma.companyProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve fazer upload da logo da empresa com sucesso.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    const response = await request(app)
      .put('/api/user/company/logo')
      .attach('logo', imagePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      logoKey: `company-profiles/${mockUser.id}/image-test.jpg`,
    });
  });
  test('deve retornar 400 quando os dados do upload forem inválidos.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    const response = await request(app)
      .put('/api/user/company/logo')
      .attach('logo', undefined);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Dados inválidos.' });
  });
  test('deve retornar 404 quando o perfil da empresa não for encontrado.', async () => {
    const response = await request(app)
      .put('/api/user/company/logo')
      .attach('logo', imagePath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil da empresa não encontrado.',
    });
  });
});

describe('userRoutes - PUT/company', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    jest.clearAllMocks();

    await prisma.companyProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve atualizar o perfil da empresa com sucesso.', async () => {
    const firstProfile = companyProfile();
    const firstAdress = userAddress();

    await request(app)
      .post('/api/user/company')
      .send({ companyData: firstProfile, addressData: firstAdress });

    const companyData = companyProfile({
      bio: null,
    });
    const addressData = userAddress({
      street: 'Rua atualizada',
      complement: 'Atualizado',
    });

    const response = await request(app)
      .put('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      companyName: companyData.companyName,
      phone: companyData.phone,
      bio: companyData.bio,
      address: {
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
      },
    });
  });
  test('deve retornar 400 quando companyData não for enviado.', async () => {
    const addressData = userAddress();

    const response = await request(app)
      .put('/api/user/company')
      .send({ addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do perfil da empresa são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do companyData não for enviado.', async () => {
    const companyData = companyProfile({
      phone: undefined,
      bio: 'Atualizado',
    });
    const addressData = userAddress();

    const response = await request(app)
      .put('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['O campo telefone é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando addressData não for enviado.', async () => {
    const companyData = companyProfile();

    const response = await request(app)
      .put('/api/user/company')
      .send({ companyData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['Os dados do endereço da empresa são obrigatórios.'],
    });
  });
  test('deve retorna 400 quando algum campo do addressData não for enviado.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress({
      street: undefined,
      complement: 'Atualizado',
    });

    const response = await request(app)
      .put('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: ['O campo rua é obrigatório.'],
    });
  });
  test('deve retornar 404 quando o perfil da empresa não for encontrado.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress();

    const response = await request(app)
      .put('/api/user/company')
      .send({ companyData, addressData });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil da empresa não encontrado.',
    });
  });
});

describe('userRoutes - GET/company/me', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'user123',
      accountType: 'COMPANY',
    };

    jest.clearAllMocks();

    await prisma.companyProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve buscar o perfil da empresa com sucesso.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    const response = await request(app).get('/api/user/company/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authUserId: mockUser.id,
      companyName: companyData.companyName,
      phone: companyData.phone,
      logoKey: null,
      bio: companyData.bio,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      address: {
        companyId: mockUser.id,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
  test('deve retornar 403 quando accountType for diferente de COMPANY', async () => {
    mockUser = {
      id: 'user123',
      accountType: 'PERSON',
    };

    const response = await request(app).get('/api/user/company/me');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Usuário não possui permissão.' });
  });
  test('deve retornar 404 quando o perfil da empresa não for encontrado.', async () => {
    const response = await request(app).get('/api/user/company/me');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil da empresa não encontrado.',
    });
  });
});

describe('userRoutes - GET/company/companyId', () => {
  beforeEach(async () => {
    mockUser = {
      id: 'company123',
      accountType: 'COMPANY',
    };

    jest.clearAllMocks();

    await prisma.companyProfile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve buscar o perfil da empresa com sucesso.', async () => {
    const companyData = companyProfile();
    const addressData = userAddress();

    await request(app)
      .post('/api/user/company')
      .send({ companyData, addressData });

    mockUser = {
      id: 'person123',
      accountType: 'PERSON',
    };

    const response = await request(app).get('/api/user/company/company123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      companyName: companyData.companyName,
      logoKey: null,
      bio: companyData.bio,
      address: {
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      },
    });
  });
  test('deve retornar 404 quando o perfil da empresa não for encontrado.', async () => {
    mockUser = {
      id: 'person123',
      accountType: 'PERSON',
    };

    const response = await request(app).get('/api/user/company/company123');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Perfil da empresa não encontrado.',
    });
  });
});
