jest.mock('../../../src/services/personService', () => ({
  createProfileService: jest.fn(),
  updateProfileService: jest.fn(),
  getMyProfileService: jest.fn(),
  getPublicProfileService: jest.fn(),
  uploadCurriculumService: jest.fn(),
  createPlatformCurriculumService: jest.fn(),
  updatePlatformCurriculumService: jest.fn(),
}));
jest.mock('../../../src/middlewares', () => ({
  asyncHandler: jest.fn((fn) => fn),
}));

const personService = require('../../../src/services/personService');
const personController = require('../../../src/controllers/personController');
const AppError = require('../../../errors/AppError');

describe('personController - createProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar perfil do usuário com foto com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('fake-image-content'),
        originalname: 'photo.jpeg',
      },
      body: {
        profileData: {
          phone: '54678543215',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua fake',
          number: '67',
          complement: null,
          neighborhood: 'Bairro fake',
          city: 'Cidade fake',
          state: 'FK',
          zipCode: '54321876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      authUserId: 'user123',
      phone: '54678543215',
      photoKey: 'person-profiles/user123/photo.jpeg',
      bio: 'bio fake',
      address: {
        personId: 'user123',
        street: 'Rua fake',
        number: '67',
        complement: null,
        neighborhood: 'Bairro fake',
        city: 'Cidade fake',
        state: 'FK',
        zipCode: '54321876',
      },
    };

    personService.createProfileService.mockResolvedValue(mockResponse);

    await personController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.profileData,
      mockReq.body.addressData,
    );
  });
  test('deve criar perfil do usuário sem foto com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: undefined,
      body: {
        profileData: {
          phone: '54678543215',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua fake',
          number: '67',
          complement: null,
          neighborhood: 'Bairro fake',
          city: 'Cidade fake',
          state: 'FK',
          zipCode: '54321876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      authUserId: 'user123',
      phone: '54678543215',
      photoKey: null,
      bio: 'bio fake',
      address: {
        personId: 'user123',
        street: 'Rua fake',
        number: '67',
        complement: null,
        neighborhood: 'Bairro fake',
        city: 'Cidade fake',
        state: 'FK',
        zipCode: '54321876',
      },
    };

    personService.createProfileService.mockResolvedValue(mockResponse);

    await personController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.profileData,
      mockReq.body.addressData,
    );
  });
  test('deve propagar o AppError retornado pelo createProfileService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('fake-image-content'),
        originalname: 'photo.jpeg',
      },
      body: {
        profileData: {
          phone: '54678543215',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua fake',
          number: '67',
          complement: null,
          neighborhood: 'Bairro fake',
          city: 'Cidade fake',
          state: 'FK',
          zipCode: '54321876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.createProfileService.mockRejectedValue(
      new AppError('Usuário já possui perfil cadastrado.', 409),
    );

    await expect(
      personController.createProfile(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.profileData,
      mockReq.body.addressData,
    );
  });
});

describe('personController - updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar perfil do usuário com foto com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('fake-image-content'),
        originalname: 'photo.jpeg',
      },
      body: {
        profileData: {
          phone: '54678543215',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua fake',
          number: '67',
          complement: null,
          neighborhood: 'Bairro fake',
          city: 'Cidade fake',
          state: 'FK',
          zipCode: '54321876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      authUserId: 'user123',
      phone: '54678543215',
      photoKey: 'person-profiles/user123/photo.jpeg',
      bio: 'bio fake',
      address: {
        street: 'Rua fake',
        number: '67',
        complement: null,
        neighborhood: 'Bairro fake',
        city: 'Cidade fake',
        state: 'FK',
        zipCode: '54321876',
      },
    };

    personService.updateProfileService.mockResolvedValue(mockResponse);

    await personController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.profileData,
      mockReq.body.addressData,
    );
  });
  test('deve atualizar perfil do usuário sem foto com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: undefined,
      body: {
        profileData: {
          phone: '54678543215',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua fake',
          number: '67',
          complement: null,
          neighborhood: 'Bairro fake',
          city: 'Cidade fake',
          state: 'FK',
          zipCode: '54321876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      authUserId: 'user123',
      phone: '54678543215',
      photoKey: null,
      bio: 'bio fake',
      address: {
        street: 'Rua fake',
        number: '67',
        complement: null,
        neighborhood: 'Bairro fake',
        city: 'Cidade fake',
        state: 'FK',
        zipCode: '54321876',
      },
    };

    personService.updateProfileService.mockResolvedValue(mockResponse);

    await personController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.profileData,
      mockReq.body.addressData,
    );
  });
  test('deve propagar o AppError retornado pelo updateProfileService.', async () => {
    const mockReq = {
      user: { id: 'user123' },
      file: {
        buffer: Buffer.from('image-fake-content'),
        originalname: 'photo.jpeg',
      },
      body: {
        profileData: {
          phone: '54678543215',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua fake',
          number: '67',
          complement: null,
          neighborhood: 'Bairro fake',
          city: 'Cidade fake',
          state: 'FK',
          zipCode: '54321876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.updateProfileService.mockRejectedValue(
      new AppError('Perfil do usuário não encontrado.', 404),
    );

    await expect(
      personController.updateProfile(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.profileData,
      mockReq.body.addressData,
    );
  });
});

describe('personController - myProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso.', async () => {
    const mockResponse = {
      authUserId: 'user123',
      phone: '54678543215',
      photoKey: 'person-profiles/user123/photo.jpeg',
      bio: 'bio fake',
      address: {
        personId: 'user123',
        street: 'Rua fake',
        number: '67',
        complement: null,
        neighborhood: 'Bairro fake',
        city: 'Cidade fake',
        state: 'FK',
        zipCode: '54321876',
      },
      curriculum: {
        personId: 'user123',
        type: 'UPLOAD',
        fileKey: 'curriculums/user123/file.pdf',
        professionalSummary: null,
        experiences: null,
        educations: null,
        courses: null,
        skills: null,
        observations: null,
      },
    };
    const mockReq = {
      user: {
        id: 'user123',
        accountType: 'PERSON',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.getMyProfileService.mockResolvedValue(mockResponse);

    await personController.myProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.getMyProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
    );
  });
  test('deve propagar o AppError retornado pelo getMyProfileService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        accountType: 'PERSON',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.getMyProfileService.mockRejectedValue(
      new AppError('Perfil do usuário não encontrado.', 404),
    );

    await expect(personController.myProfile(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.getMyProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
    );
  });
});

describe('personController - publicProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso.', async () => {
    const mockResponse = {
      photoKey: 'person-profiles/candidate123/photo.jpeg',
      bio: 'Bio Fake',
      address: {
        city: 'Poços de Caldas',
        state: 'MG',
        neighborhood: 'Bairro Fake',
      },
      curriculum: {
        type: 'UPLOAD',
        fileKey: 'curriculums/candidate123/file.pdf',
        professionalSummary: null,
        experiences: null,
        educations: null,
        courses: null,
        skills: null,
        observations: null,
      },
    };
    const mockReq = {
      user: {
        id: 'user123',
      },
      params: {
        personId: 'candidate123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.getPublicProfileService.mockResolvedValue(mockResponse);

    await personController.publicProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.getPublicProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.params.personId,
    );
  });
  test('deve propagar o AppError retornado pelo getPublicProfileService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      params: {
        personId: 'candidate123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.getPublicProfileService.mockRejectedValue(
      new AppError('Perfil do usuário não encontrado.', 404),
    );

    await expect(
      personController.publicProfile(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.getPublicProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.params.personId,
    );
  });
});

describe('personController - uploadCurriculum', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve fazer upload do currículo com sucesso.', async () => {
    const mockResponse = {
      personId: 'user123',
      type: 'UPLOAD',
      fileKey: 'curriculums/user123/file.pdf',
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };
    const mockReq = {
      user: {
        id: 'user123',
        accountType: 'PERSON',
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

    personService.uploadCurriculumService.mockResolvedValue(mockResponse);

    await personController.uploadCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.uploadCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
      mockReq.file,
    );
  });
  test('deve propagar o AppError retornado pelo uploadCurriculumService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        accountType: 'COMPANY',
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

    personService.uploadCurriculumService.mockRejectedValue(
      new AppError('Usuário não possui permissão.', 403),
    );

    await expect(
      personController.uploadCurriculum(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.uploadCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
      mockReq.file,
    );
  });
});

describe('personController - createPlataformCurriculum', () => {
  beforeEach(() => {
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
    const mockResponse = {
      personId: 'user123',
      type: 'PLATFORM',
      fileKey: null,
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
        accountType: 'PERSON',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.createPlatformCurriculumService.mockResolvedValue(
      mockResponse,
    );

    await personController.createPlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.createPlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
      mockReq.body,
    );
  });
  test('deve propagar o AppError retornado pelo createPlatformCurriculumService.', async () => {
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
        accountType: 'COMPANY',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.createPlatformCurriculumService.mockRejectedValue(
      new AppError('Usuário não possui permissão.', 403),
    );

    await expect(
      personController.createPlatformCurriculum(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.createPlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
      mockReq.body,
    );
  });
});

describe('personController - updatePlataformCurriculum', () => {
  beforeEach(() => {
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
    const mockResponse = {
      personId: 'user123',
      type: 'PLATFORM',
      fileKey: null,
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
        accountType: 'PERSON',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.updatePlatformCurriculumService.mockResolvedValue(
      mockResponse,
    );

    await personController.updatePlatformCurriculum(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(personService.updatePlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
      mockReq.body,
    );
  });
  test('deve propagar o AppError retornado pelo updatePlatformCurriculumService.', async () => {
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
        accountType: 'PERSON',
      },
      body: mockCurriculumData,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    personService.updatePlatformCurriculumService.mockRejectedValue(
      new AppError('Este tipo de currículo não aceita atualizações.', 400),
    );

    await expect(
      personController.updatePlatformCurriculum(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(personService.updatePlatformCurriculumService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
      mockReq.body,
    );
  });
});
