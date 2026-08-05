jest.mock('../../../src/services', () => ({
  userService: {
    createProfileService: jest.fn(),
    updateProfileService: jest.fn(),
    getMeService: jest.fn(),
    getProfileService: jest.fn(),
    uploadCurriculumService: jest.fn(),
    createPlatformCurriculumService: jest.fn(),
    updatePlatformCurriculumService: jest.fn(),
  },
}));
jest.mock('../../../src/config/logger');

const { userService } = require('../../../src/services');
const userController = require('../../../src/controllers/userController');
const logger = require('../../../src/config/logger');
const AppError = require('../../../errors/AppError');

describe('userController - createProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar perfil do usuário com foto com sucesso.', async () => {
    const mockProfileData = {
      phone: '67853623451',
      bio: 'bio fake',
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('fake-image-content'),
        originalname: 'photo.jpeg',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockResult = {
      authUserId: mockReq.user.id,
      phone: mockReq.body.phone,
      photoKey: 'profiles/user123/photo.jpeg',
      bio: mockReq.body.bio,
      city: mockReq.body.city,
      state: mockReq.body.state,
    };

    userService.createProfileService.mockResolvedValue(mockResult);

    await userController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file.buffer,
      mockReq.file.originalname,
      mockReq.body,
    );
  });
  test('deve criar perfil do usuário sem foto com sucesso.', async () => {
    const mockProfileData = {
      phone: '67853623451',
      bio: 'bio fake',
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockReq = {
      user: {
        id: 'user123',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockResult = {
      authUserId: mockReq.user.id,
      phone: mockReq.body.phone,
      photoKey: null,
      bio: mockReq.body.bio,
      city: mockReq.body.city,
      state: mockReq.body.state,
    };

    userService.createProfileService.mockResolvedValue(mockResult);

    await userController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      undefined,
      undefined,
      mockReq.body,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockProfileData = {
      phone: '67853623451',
      bio: 'bio fake',
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('fake-image-content'),
        originalname: 'photo.jpeg',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.createProfileService.mockRejectedValue(
      new AppError('Usuário já possui perfil cadastrado.', 409),
    );

    await userController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário já possui perfil cadastrado.',
    });
    expect(userService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file.buffer,
      mockReq.file.originalname,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao criar perfil do usuário.',
      { error: 'Usuário já possui perfil cadastrado.' },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockProfileData = {
      phone: '35978624163',
      bio: 'Bio Fake',
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockReq = {
      user: { id: 'user123' },
      file: {
        buffer: Buffer.from('fake-image-content'),
        originalname: 'photo.jpeg',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.createProfileService.mockRejectedValue(new Error('Fail.'));

    await userController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file.buffer,
      mockReq.file.originalname,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao criar perfil do usuário.',
      { error: 'Fail.' },
    );
  });
});

describe('userController - updateProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar perfil do usuário com foto com sucesso.', async () => {
    const mockProfileData = {
      phone: '235678935262',
      bio: 'Bio Fake',
      city: 'Poços de caldas',
      state: 'MG',
    };
    const mockReq = {
      user: { id: 'user123' },
      file: {
        buffer: Buffer.from('image-fake-content'),
        originalname: 'photo.jpeg',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResult = {
      phone: mockReq.body.phone,
      bio: mockReq.body.bio,
      city: mockReq.body.city,
      state: mockReq.body.state,
      photoKey: 'profiles/user123/photo.jpeg',
    };

    userService.updateProfileService.mockResolvedValue(mockResult);

    await userController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file.buffer,
      mockReq.file.originalname,
      mockReq.body,
    );
  });
  test('deve atualizar perfil do usuário sem foto com sucesso.', async () => {
    const mockProfileData = {
      phone: '235678935262',
      bio: 'Bio Fake',
      city: 'Poços de caldas',
      state: 'MG',
    };
    const mockReq = {
      user: { id: 'user123' },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResult = {
      phone: mockReq.body.phone,
      bio: mockReq.body.bio,
      city: mockReq.body.city,
      state: mockReq.body.state,
    };

    userService.updateProfileService.mockResolvedValue(mockResult);

    await userController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      undefined,
      undefined,
      mockReq.body,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockProfileData = {
      phone: '234567895341',
      bio: 'Bio Fake',
      city: 'Poços de caldas',
      state: 'MG',
    };
    const mockReq = {
      user: { id: 'user123' },
      file: {
        buffer: Buffer.from('image-fake-content'),
        originalname: 'photo.jpeg',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.updateProfileService.mockRejectedValue(
      new AppError('Perfil do usuário não encontrado.', 404),
    );

    await userController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Perfil do usuário não encontrado.',
    });
    expect(userService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file.buffer,
      mockReq.file.originalname,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao atualizar perfil do usuário.',
      {
        error: 'Perfil do usuário não encontrado.',
      },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockProfileData = {
      phone: '234567895341',
      bio: 'Bio Fake',
      city: 'Poços de caldas',
      state: 'MG',
    };
    const mockReq = {
      user: { id: 'user123' },
      file: {
        buffer: Buffer.from('image-fake-content'),
        originalname: 'photo.jpeg',
      },
      body: mockProfileData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.updateProfileService.mockRejectedValue(new Error('Fail.'));

    await userController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file.buffer,
      mockReq.file.originalname,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao atualizar perfil do usuário.',
      {
        error: 'Fail.',
      },
    );
  });
});

describe('userController - me', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso.', async () => {
    const mockResult = {
      phone: '23478956325',
      photoKey: 'profiles/user123/photo.jpeg',
      bio: 'Bio Fake',
      city: 'Poços de Caldas',
      state: 'MG',
      curriculum: {
        userId: 'user123',
        type: 'UPLOAD',
        fileKey: 'curriculums/user123/file.pdf',
      },
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.getMeService.mockResolvedValue(mockResult);

    await userController.me(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.getMeService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.getMeService.mockRejectedValue(
      new AppError('Perfil do usuário não encontrado.', 404),
    );

    await userController.me(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Perfil do usuário não encontrado.',
    });
    expect(userService.getMeService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao buscar perfil do usuário.',
      { error: 'Perfil do usuário não encontrado.' },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.getMeService.mockRejectedValue(new Error('Fail.'));

    await userController.me(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.getMeService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao buscar perfil do usuário.',
      { error: 'Fail.' },
    );
  });
});

describe('userController - getProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso.', async () => {
    const mockResult = {
      phone: '12865412895',
      photoKey: 'profiles/candidate123/photo.jpeg',
      bio: 'Bio Fake',
      city: 'Poços de Caldas',
      state: 'MG',
      curriculum: {
        userId: 'candidate123',
        type: 'UPLOAD',
        fileKey: 'curriculums/candidate123/file.pdf',
      },
    };
    const mockReq = {
      params: {
        userId: 'candidate123',
      },
      user: {
        role: 'RECRUTADOR',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.getProfileService.mockResolvedValue(mockResult);

    await userController.getProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.getProfileService).toHaveBeenCalledWith(
      mockReq.params.userId,
      mockReq.user.role,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      params: {
        userId: 'candidate123',
      },
      user: {
        role: 'CANDIDATO',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.getProfileService.mockRejectedValue(
      new AppError('Usuário não possui permissão.', 403),
    );

    await userController.getProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não possui permissão.',
    });
    expect(userService.getProfileService).toHaveBeenCalledWith(
      mockReq.params.userId,
      mockReq.user.role,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao buscar perfil do usuário.',
      { error: 'Usuário não possui permissão.' },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockReq = {
      params: {
        userId: 'candidate123',
      },
      user: {
        role: 'RECRUTADOR',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.getProfileService.mockRejectedValue(new Error('Fail.'));

    await userController.getProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.getProfileService).toHaveBeenCalledWith(
      mockReq.params.userId,
      mockReq.user.role,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao buscar perfil do usuário.',
      { error: 'Fail.' },
    );
  });
});

describe('userController - uploadCurriculum', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve fazer upload do currículo com sucesso.', async () => {
    const mockResult = {
      userId: 'user123',
      type: 'UPLOAD',
      fileKey: 'curriculums/user123/file.pdf',
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      file: {
        buffer: Buffer.from('curriculum-fake-content'),
        originalname: 'curriculo.pdf',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.uploadCurriculumService.mockResolvedValue(mockResult);

    await userController.uploadCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.uploadCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.file.buffer,
      mockReq.file.originalname,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        role: 'RECRUTADOR',
      },
      file: {
        buffer: Buffer.from('curriculum-fake-content'),
        originalname: 'curriculo.pdf',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.uploadCurriculumService.mockRejectedValue(
      new AppError('Usuário não possui permissão.', 403),
    );

    await userController.uploadCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não possui permissão.',
    });
    expect(userService.uploadCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.file.buffer,
      mockReq.file.originalname,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar currículo do usuário.',
      {
        error: 'Usuário não possui permissão.',
      },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      file: {
        buffer: Buffer.from('curriculum-fake-content'),
        originalname: 'curriculo.pdf',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.uploadCurriculumService.mockRejectedValue(new Error('Fail.'));

    await userController.uploadCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.uploadCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.file.buffer,
      mockReq.file.originalname,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar currículo do usuário.',
      { error: 'Fail.' },
    );
  });
});

describe('userController - createPlataformCurriculum', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar currículo com sucesso.', async () => {
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experience',
      educations: 'Fake education',
      courses: 'Fake course',
      skills: 'Fake skill',
      observations: 'Fake observation',
    };
    const mockResult = {
      userId: 'user123',
      type: 'PLATFORM',
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.createPlatformCurriculumService.mockResolvedValue(mockResult);

    await userController.createPlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.createPlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.body,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experience',
      educations: 'Fake education',
      courses: 'Fake course',
      skills: 'Fake skill',
      observations: 'Fake observation',
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'RECRUTADOR',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.createPlatformCurriculumService.mockRejectedValue(
      new AppError('Usuário não possui permissão.', 403),
    );

    await userController.createPlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Usuário não possui permissão.',
    });
    expect(userService.createPlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao criar currículo do usuário.',
      {
        error: 'Usuário não possui permissão.',
      },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experience',
      educations: 'Fake education',
      courses: 'Fake course',
      skills: 'Fake skill',
      observations: 'Fake observation',
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.createPlatformCurriculumService.mockRejectedValue(
      new Error('Fail.'),
    );

    await userController.createPlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.createPlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao criar currículo do usuário.',
      {
        error: 'Fail.',
      },
    );
  });
});

describe('userController - updatePlataformCurriculum', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar currículo com sucesso.', async () => {
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experience',
      educations: 'Fake education',
      courses: 'Fake course',
      skills: 'Fake skill',
      observations: 'Fake observation',
    };
    const mockResult = {
      userId: 'user123',
      type: 'PLATFORM',
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.updatePlatformCurriculumService.mockResolvedValue(mockResult);

    await userController.updatePlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(userService.updatePlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.body,
    );
  });
  test('deve retornar status e mensagem do AppError lançado pelo service.', async () => {
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experience',
      educations: 'Fake education',
      courses: 'Fake course',
      skills: 'Fake skill',
      observations: 'Fake observation',
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.updatePlatformCurriculumService.mockRejectedValue(
      new AppError('Este tipo de currículo não aceita atualizações.', 400),
    );

    await userController.updatePlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Este tipo de currículo não aceita atualizações.',
    });
    expect(userService.updatePlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao atualizar currículo do usuário.',
      {
        error: 'Este tipo de currículo não aceita atualizações.',
      },
    );
  });
  test('deve retornar status 500 para erro interno.', async () => {
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experience',
      educations: 'Fake education',
      courses: 'Fake course',
      skills: 'Fake skill',
      observations: 'Fake observation',
    };
    const mockReq = {
      user: {
        id: 'user123',
        role: 'CANDIDATO',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userService.updatePlatformCurriculumService.mockRejectedValue(
      new Error('Fail.'),
    );

    await userController.updatePlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Erro interno no servidor.',
    });
    expect(userService.updatePlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.role,
      mockReq.body,
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao atualizar currículo do usuário.',
      {
        error: 'Fail.',
      },
    );
  });
});
