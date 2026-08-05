jest.mock('../../../src/services/uploadFileService', () => jest.fn());
jest.mock('../../../src/services/deleteFileService', () => jest.fn());
jest.mock('../../../src/config/prisma', () => ({
  userProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  curriculum: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
}));
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const userService = require('../../../src/services/userService');
const uploadFile = require('../../../src/services/uploadFileService');
const deleteFile = require('../../../src/services/deleteFileService');
const prisma = require('../../../src/config/prisma');
const { CurriculumType } = require('@prisma/client');
const logger = require('../../../src/config/logger');
const AppError = require('../../../errors/AppError');

describe('userService - createProfileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar o perfil do usuário com sucesso mas sem upload de foto', async () => {
    const mockUserId = 'user123';
    const mockBuffer = null;
    const mockFileName = null;
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockNewProfile = {
      authUserId: mockUserId,
      phone: mockProfileData.phone,
      photoKey: null,
      bio: mockProfileData.bio,
      city: mockProfileData.city,
      state: mockProfileData.state,
    };

    prisma.userProfile.findUnique.mockResolvedValue(null);

    prisma.userProfile.create.mockResolvedValue(mockNewProfile);

    const mockResult = await userService.createProfileService(
      mockUserId,
      mockBuffer,
      mockFileName,
      mockProfileData,
    );

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: { authUserId: true },
    });
    expect(prisma.userProfile.create).toHaveBeenCalledWith({
      data: {
        authUserId: mockUserId,
        phone: mockProfileData.phone,
        photoKey: null,
        bio: mockProfileData.bio,
        city: mockProfileData.city,
        state: mockProfileData.state,
      },
      select: {
        authUserId: true,
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
      },
    });
    expect(mockResult).toEqual(mockNewProfile);
    expect(logger.info).toHaveBeenCalledWith('Perfil criado com sucesso.', {
      userId: mockUserId,
    });
    expect(uploadFile).not.toHaveBeenCalled();
  });
  test('deve criar o perfil do usuário com upload de foto', async () => {
    const mockUserId = 'user123';
    const mockBuffer = Buffer.from('fake-image-content');
    const mockFileName = 'photo.jpeg';
    const mockKey = 'profiles/user123/photo.jpeg';
    const mockNewPhotoKey = mockKey;
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockNewProfile = {
      authUserId: mockUserId,
      phone: mockProfileData.phone,
      photoKey: mockNewPhotoKey,
      bio: mockProfileData.bio,
      city: mockProfileData.city,
      state: mockProfileData.state,
    };

    prisma.userProfile.findUnique.mockResolvedValue(null);

    uploadFile.mockResolvedValue(mockKey);

    prisma.userProfile.create.mockResolvedValue(mockNewProfile);

    const mockResult = await userService.createProfileService(
      mockUserId,
      mockBuffer,
      mockFileName,
      mockProfileData,
    );

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: { authUserId: true },
    });
    expect(uploadFile).toHaveBeenCalledWith(mockBuffer, mockKey);
    expect(prisma.userProfile.create).toHaveBeenCalledWith({
      data: {
        authUserId: mockUserId,
        phone: mockProfileData.phone,
        photoKey: mockNewPhotoKey,
        bio: mockProfileData.bio,
        city: mockProfileData.city,
        state: mockProfileData.state,
      },
      select: {
        authUserId: true,
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
      },
    });
    expect(mockResult).toEqual(mockNewProfile);
    expect(logger.info).toHaveBeenCalledWith('Perfil criado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve gerar erro caso userId não for enviado', async () => {
    const mockUserId = undefined;
    const mockBuffer = Buffer.from('fake-image-content');
    const mockFileName = 'photo.jpeg';
    const mockProfileData = {
      phone: '35976542341',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };

    try {
      await userService.createProfileService(
        mockUserId,
        mockBuffer,
        mockFileName,
        mockProfileData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.userProfile.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário já passua um perfil', async () => {
    const mockUserId = 'user123';
    const mockBuffer = Buffer.from('fake-image-content');
    const mockFileName = 'photo.jpeg';
    const mockProfileData = {
      phone: '35965423167',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };

    prisma.userProfile.findUnique.mockResolvedValue({ authUserId: mockUserId });

    try {
      await userService.createProfileService(
        mockUserId,
        mockBuffer,
        mockFileName,
        mockProfileData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário já possui perfil cadastrado.');
    }

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: { authUserId: true },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de criar perfil já existente.',
      { userId: mockUserId },
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });
});

describe('userService - updateProfileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar perfil do usuário com sucesso mas sem upload de foto', async () => {
    const mockUserId = 'user123';
    const mockBuffer = null;
    const mockFileName = null;
    const mockProfileData = {
      phone: '76063568342',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockUpdatedProfile = {
      authUserId: mockUserId,
      photoKey: null,
      phone: mockProfileData.phone,
      bio: mockProfileData.bio,
      city: mockProfileData.city,
      state: mockProfileData.state,
    };

    prisma.userProfile.findUnique.mockResolvedValue({
      authUserId: mockUserId,
      photoKey: null,
    });

    prisma.userProfile.update.mockResolvedValue(mockUpdatedProfile);

    const mockResult = await userService.updateProfileService(
      mockUserId,
      mockBuffer,
      mockFileName,
      mockProfileData,
    );

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: { authUserId: true, photoKey: true },
    });
    expect(prisma.userProfile.update).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      data: mockProfileData,
      select: {
        authUserId: true,
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
      },
    });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(mockResult).toEqual(mockUpdatedProfile);
    expect(logger.info).toHaveBeenCalledWith('Perfil atualizado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve atualizar perfil do usuário com sucesso com upload de foto', async () => {
    const mockUserId = 'user123';
    const mockBuffer = Buffer.from('fake-image-content');
    const mockFileName = 'photo.jpeg';
    const mockKey = 'profiles/user123/photo.jpeg';
    const mockOldPhotoKey = 'profiles/user123/old-photo.jpeg';
    const mockNewPhotoKey = mockKey;
    const mockProfileData = {
      phone: '76063568342',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };
    const mockData = {
      phone: '76063568342',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
      photoKey: mockNewPhotoKey,
    };
    const mockUpdatedProfile = {
      authUserId: mockUserId,
      photoKey: mockNewPhotoKey,
      phone: mockProfileData.phone,
      bio: mockProfileData.bio,
      city: mockProfileData.city,
      state: mockProfileData.state,
    };

    prisma.userProfile.findUnique.mockResolvedValue({
      authUserId: mockUserId,
      photoKey: mockOldPhotoKey,
    });

    deleteFile.mockResolvedValue();

    uploadFile.mockResolvedValue(mockKey);

    prisma.userProfile.update.mockResolvedValue(mockUpdatedProfile);

    const mockResult = await userService.updateProfileService(
      mockUserId,
      mockBuffer,
      mockFileName,
      mockProfileData,
    );

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: { authUserId: true, photoKey: true },
    });
    expect(deleteFile).toHaveBeenCalledWith(mockOldPhotoKey);
    expect(uploadFile).toHaveBeenCalledWith(mockBuffer, mockKey);
    expect(prisma.userProfile.update).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      data: mockData,
      select: {
        authUserId: true,
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
      },
    });
    expect(mockResult).toEqual(mockUpdatedProfile);
    expect(logger.info).toHaveBeenCalledWith('Perfil atualizado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve gerar erro caso userId não for enviado', async () => {
    const mockUserId = null;
    const mockBuffer = null;
    const mockFileName = null;
    const mockProfileData = {
      phone: '76063568342',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };

    try {
      await userService.updateProfileService(
        mockUserId,
        mockBuffer,
        mockFileName,
        mockProfileData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.userProfile.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockUserId = 'user123';
    const mockBuffer = Buffer.from('fake-image-content');
    const mockFileName = 'photo.jpeg';
    const mockProfileData = {
      phone: '35965423167',
      bio: null,
      city: 'Poços de Caldas',
      state: 'MG',
    };

    prisma.userProfile.findUnique.mockResolvedValue(null);

    try {
      await userService.updateProfileService(
        mockUserId,
        mockBuffer,
        mockFileName,
        mockProfileData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: { authUserId: true, photoKey: true },
    });
    expect(deleteFile).not.toHaveBeenCalled();
    expect(uploadFile).not.toHaveBeenCalled();
    expect(prisma.userProfile.update).not.toHaveBeenCalled();
  });
});

describe('userService - getMeService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário CANDIDATO com sucesso', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockProfile = {
      phone: '23567890534',
      photoKey: 'profiles/user123/photo.jpeg',
      bio: null,
      city: 'Campinas',
      state: 'SP',
      curriculum: 'curriculums/user123/me.pdf',
    };

    prisma.userProfile.findUnique.mockResolvedValue(mockProfile);

    const mockResult = await userService.getMeService(mockUserId, mockRole);

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: {
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
        curriculum: true,
      },
    });
    expect(mockResult).toEqual(mockProfile);
  });
  test('deve buscar o perfil do usuário RECRUTADOR com sucesso', async () => {
    const mockUserId = 'user123';
    const mockRole = 'RECRUTADOR';
    const mockProfile = {
      phone: '23567890534',
      photoKey: 'profiles/user123/photo.jpeg',
      city: 'Campinas',
      state: 'SP',
    };

    prisma.userProfile.findUnique.mockResolvedValue(mockProfile);

    const mockResult = await userService.getMeService(mockUserId, mockRole);

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: {
        phone: true,
        photoKey: true,
        bio: false,
        city: true,
        state: true,
        curriculum: false,
      },
    });
    expect(mockResult).toEqual(mockProfile);
  });
  test('deve gerar erro caso algum parâmetro esteja ausente', async () => {
    const mockUserId = 'user123';
    const mockRole = undefined;

    try {
      await userService.getMeService(mockUserId, mockRole);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.userProfile.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';

    prisma.userProfile.findUnique.mockResolvedValue(null);

    try {
      await userService.getMeService(mockUserId, mockRole);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockUserId },
      select: {
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
        curriculum: true,
      },
    });
  });
});

describe('userService - getProfileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso', async () => {
    const mockCandidateId = 'user123';
    const mockRole = 'RECRUTADOR';
    const mockProfile = {
      phone: '23567890534',
      photoKey: 'profiles/user123/photo.jpeg',
      bio: null,
      city: 'Campinas',
      state: 'SP',
      curriculum: 'curriculums/user123/me.pdf',
    };

    prisma.userProfile.findUnique.mockResolvedValue(mockProfile);

    const mockResult = await userService.getProfileService(
      mockCandidateId,
      mockRole,
    );

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockCandidateId },
      select: {
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
        curriculum: true,
      },
    });
    expect(mockResult).toEqual(mockProfile);
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockCandidateId = 'user123';
    const mockRole = undefined;

    try {
      await userService.getProfileService(mockCandidateId, mockRole);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.userProfile.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso role seja diferente de RECRUTADOR', async () => {
    const mockCandidateId = 'user123';
    const mockRole = 'CANDIDATO';

    try {
      await userService.getProfileService(mockCandidateId, mockRole);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(prisma.userProfile.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockCandidateId = 'user123';
    const mockRole = 'RECRUTADOR';

    prisma.userProfile.findUnique.mockResolvedValue(null);

    try {
      await userService.getProfileService(mockCandidateId, mockRole);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { authUserId: mockCandidateId },
      select: {
        phone: true,
        photoKey: true,
        bio: true,
        city: true,
        state: true,
        curriculum: true,
      },
    });
  });
});

describe('userService - uploadCurriculumService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve fazer upload do currículo com sucesso', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockBuffer = Buffer.from('fake-curriculo-content');
    const mockFileName = 'curriculo.pdf';
    const mockKey = 'curriculums/user123/curriculo.pdf';
    const mockUploadedCurriculum = {
      userId: mockUserId,
      type: CurriculumType.UPLOAD,
      fileKey: mockKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };

    prisma.curriculum.findUnique.mockResolvedValue(null);

    uploadFile.mockResolvedValue(mockKey);

    prisma.curriculum.upsert.mockResolvedValue(mockUploadedCurriculum);

    const mockResult = await userService.uploadCurriculumService(
      mockUserId,
      mockRole,
      mockBuffer,
      mockFileName,
    );

    expect(mockResult).toEqual(mockUploadedCurriculum);
    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { fileKey: true },
    });
    expect(deleteFile).not.toHaveBeenCalled();
    expect(uploadFile).toHaveBeenCalledWith(mockBuffer, mockKey);
    expect(prisma.curriculum.upsert).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      update: {
        type: CurriculumType.UPLOAD,
        fileKey: mockKey,
        professionalSummary: null,
        experiences: null,
        educations: null,
        courses: null,
        skills: null,
        observations: null,
      },
      create: {
        userId: mockUserId,
        type: CurriculumType.UPLOAD,
        fileKey: mockKey,
      },
    });
    expect(logger.info).toHaveBeenCalledWith('Currículo enviado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve deletar antigo e fazer upload do currículo com sucesso', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockBuffer = Buffer.from('fake-curriculo-content');
    const mockFileName = 'curriculo.pdf';
    const mockKey = 'curriculums/user123/curriculo.pdf';
    const mockOldFileKey = 'curriculums/user123/joao.pdf';
    const mockExistingCurriculum = {
      fileKey: mockOldFileKey,
    };
    const mockUploadedCurriculum = {
      userId: mockUserId,
      type: CurriculumType.UPLOAD,
      fileKey: mockKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };

    prisma.curriculum.findUnique.mockResolvedValue(mockExistingCurriculum);

    deleteFile.mockResolvedValue();

    uploadFile.mockResolvedValue(mockKey);

    prisma.curriculum.upsert.mockResolvedValue(mockUploadedCurriculum);

    const mockResult = await userService.uploadCurriculumService(
      mockUserId,
      mockRole,
      mockBuffer,
      mockFileName,
    );

    expect(mockResult).toEqual(mockUploadedCurriculum);
    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { fileKey: true },
    });
    expect(deleteFile).toHaveBeenCalledWith(mockOldFileKey);
    expect(uploadFile).toHaveBeenCalledWith(mockBuffer, mockKey);
    expect(prisma.curriculum.upsert).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      update: {
        type: CurriculumType.UPLOAD,
        fileKey: mockKey,
        professionalSummary: null,
        experiences: null,
        educations: null,
        courses: null,
        skills: null,
        observations: null,
      },
      create: {
        userId: mockUserId,
        type: CurriculumType.UPLOAD,
        fileKey: mockKey,
      },
    });
    expect(logger.info).toHaveBeenCalledWith('Currículo enviado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockBuffer = undefined;
    const mockFileName = 'curriculo.pdf';

    try {
      await userService.uploadCurriculumService(
        mockUserId,
        mockRole,
        mockBuffer,
        mockFileName,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.curriculum.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso role for diferente de CANDIDATO', async () => {
    const mockUserId = 'user123';
    const mockRole = 'RECRUTADOR';
    const mockBuffer = Buffer.from('fake-curriculo-content');
    const mockFileName = 'curriculo.pdf';

    try {
      await userService.uploadCurriculumService(
        mockUserId,
        mockRole,
        mockBuffer,
        mockFileName,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário sem permissão para upload.',
      { userId: mockUserId, role: mockRole },
    );
    expect(prisma.curriculum.findUnique).not.toHaveBeenCalled();
  });
});

describe('userService - createPlatformCurriculumService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar currículo com sucesso', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockCreateCurriculum = {
      userId: mockUserId,
      type: CurriculumType.PLATFORM,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };

    prisma.curriculum.findUnique.mockResolvedValue(null);

    prisma.curriculum.upsert.mockResolvedValue(mockCreateCurriculum);

    const mockResult = await userService.createPlatformCurriculumService(
      mockUserId,
      mockRole,
      mockCurriculumData,
    );

    expect(mockResult).toEqual(mockCreateCurriculum);
    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { fileKey: true },
    });
    expect(deleteFile).not.toHaveBeenCalled();
    expect(prisma.curriculum.upsert).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      update: {
        type: CurriculumType.PLATFORM,
        fileKey: null,
        professionalSummary: mockCurriculumData.professionalSummary,
        experiences: mockCurriculumData.experiences,
        educations: mockCurriculumData.educations,
        courses: mockCurriculumData.courses,
        skills: mockCurriculumData.skills,
        observations: mockCurriculumData.observations,
      },
      create: {
        userId: mockUserId,
        type: CurriculumType.PLATFORM,
        professionalSummary: mockCurriculumData.professionalSummary,
        experiences: mockCurriculumData.experiences,
        educations: mockCurriculumData.educations,
        courses: mockCurriculumData.courses,
        skills: mockCurriculumData.skills,
        observations: mockCurriculumData.observations,
      },
    });
    expect(logger.info).toHaveBeenCalledWith('Currículo criado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve substituir currículo em PDF por currículo da plataforma', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockFileKey = 'curriculums/user123/upload.pdf';
    const mockCurriculumExist = {
      fileKey: mockFileKey,
    };
    const mockCreateCurriculum = {
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };

    prisma.curriculum.findUnique.mockResolvedValue(mockCurriculumExist);

    deleteFile.mockResolvedValue();

    prisma.curriculum.upsert.mockResolvedValue(mockCreateCurriculum);

    const mockResult = await userService.createPlatformCurriculumService(
      mockUserId,
      mockRole,
      mockCurriculumData,
    );

    expect(mockResult).toEqual(mockCreateCurriculum);
    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { fileKey: true },
    });
    expect(deleteFile).toHaveBeenCalledWith(mockFileKey);
    expect(prisma.curriculum.upsert).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      update: {
        type: CurriculumType.PLATFORM,
        fileKey: null,
        professionalSummary: mockCurriculumData.professionalSummary,
        experiences: mockCurriculumData.experiences,
        educations: mockCurriculumData.educations,
        courses: mockCurriculumData.courses,
        skills: mockCurriculumData.skills,
        observations: mockCurriculumData.observations,
      },
      create: {
        userId: mockUserId,
        type: CurriculumType.PLATFORM,
        professionalSummary: mockCurriculumData.professionalSummary,
        experiences: mockCurriculumData.experiences,
        educations: mockCurriculumData.educations,
        courses: mockCurriculumData.courses,
        skills: mockCurriculumData.skills,
        observations: mockCurriculumData.observations,
      },
    });
    expect(logger.info).toHaveBeenCalledWith('Currículo criado com sucesso.', {
      userId: mockUserId,
    });
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = undefined;

    try {
      await userService.createPlatformCurriculumService(
        mockUserId,
        mockRole,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.curriculum.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso role for diferente de CANDIDATO', async () => {
    const mockUserId = 'user123';
    const mockRole = 'RECRUTADOR';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };

    try {
      await userService.createPlatformCurriculumService(
        mockUserId,
        mockRole,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário sem permissão para criar currículo.',
      { userId: mockUserId, role: mockRole },
    );
    expect(prisma.curriculum.findUnique).not.toHaveBeenCalled();
  });
});

describe('userService - updatePlatformCurriculumService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar currículo com sucesso', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockCurriculumExist = { type: CurriculumType.PLATFORM };
    const mockUpdatedCurriculum = {
      userId: mockUserId,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };

    prisma.curriculum.findUnique.mockResolvedValue(mockCurriculumExist);

    prisma.curriculum.update.mockResolvedValue(mockUpdatedCurriculum);

    const mockResult = await userService.updatePlatformCurriculumService(
      mockUserId,
      mockRole,
      mockCurriculumData,
    );

    expect(mockResult).toEqual(mockUpdatedCurriculum);
    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { type: true },
    });
    expect(prisma.curriculum.update).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      data: {
        professionalSummary: mockCurriculumData.professionalSummary,
        experiences: mockCurriculumData.experiences,
        educations: mockCurriculumData.educations,
        courses: mockCurriculumData.courses,
        skills: mockCurriculumData.skills,
        observations: mockCurriculumData.observations,
      },
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Currículo atualizado com sucesso.',
      {
        userId: mockUserId,
      },
    );
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = undefined;

    try {
      await userService.updatePlatformCurriculumService(
        mockUserId,
        mockRole,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(prisma.curriculum.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso role for diferente de CANDIDATO', async () => {
    const mockUserId = 'user123';
    const mockRole = 'RECRUTADOR';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };

    try {
      await userService.updatePlatformCurriculumService(
        mockUserId,
        mockRole,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário sem permissão para atualizar currículo.',
      { userId: mockUserId, role: mockRole },
    );
    expect(prisma.curriculum.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso não encontre currículo', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };

    prisma.curriculum.findUnique.mockResolvedValue(null);

    try {
      await userService.updatePlatformCurriculumService(
        mockUserId,
        mockRole,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Currículo não encontrado.');
    }

    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { type: true },
    });
    expect(prisma.curriculum.update).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso tipo do currículo seja diferente de PLATFORM', async () => {
    const mockUserId = 'user123';
    const mockRole = 'CANDIDATO';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockCurriculumExist = { type: CurriculumType.UPLOAD };

    prisma.curriculum.findUnique.mockResolvedValue(mockCurriculumExist);

    try {
      await userService.updatePlatformCurriculumService(
        mockUserId,
        mockRole,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(
        'Este tipo de currículo não aceita atualizações.',
      );
    }

    expect(prisma.curriculum.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { type: true },
    });
    expect(prisma.curriculum.update).not.toHaveBeenCalled();
  });
});
