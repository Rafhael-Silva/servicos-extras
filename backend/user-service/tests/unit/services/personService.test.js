jest.mock('../../../src/storage/uploadFile', () => jest.fn());
jest.mock('../../../src/storage/deleteFile', () => jest.fn());
jest.mock('../../../src/repositories', () => ({
  personProfileRepository: {
    create: jest.fn(),
    update: jest.fn(),
    getPublicProfile: jest.fn(),
    getMyProfile: jest.fn(),
    findByAuthUserId: jest.fn(),
    updatePhoto: jest.fn(),
  },
  personAddressRepository: {
    create: jest.fn(),
    update: jest.fn(),
  },
  curriculumRepository: {
    findByPersonId: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const personService = require('../../../src/services/personService');
const uploadFile = require('../../../src/storage/uploadFile');
const deleteFile = require('../../../src/storage/deleteFile');
const {
  personProfileRepository,
  personAddressRepository,
  curriculumRepository,
} = require('../../../src/repositories');
const { CurriculumType } = require('@prisma/client');
const logger = require('../../../src/config/logger');
const AppError = require('../../../errors/AppError');

describe('personService - createProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar o perfil do usuário com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
    };
    const mockDataProfile = {
      authUserId: mockAuthUserId,
      phone: mockProfileData.phone,
      bio: mockProfileData.bio,
    };
    const mockDataAddress = {
      personId: mockAuthUserId,
      street: mockAddressData.street,
      number: mockAddressData.number,
      complement: mockAddressData.complement,
      neighborhood: mockAddressData.neighborhood,
      city: mockAddressData.city,
      state: mockAddressData.state,
      zipCode: mockAddressData.zipCode,
    };

    personProfileRepository.findByAuthUserId.mockResolvedValue(null);

    personProfileRepository.create.mockResolvedValue(mockDataProfile);

    personAddressRepository.create.mockResolvedValue(mockDataAddress);

    const mockResult = await personService.createProfileService(
      mockAuthUserId,
      mockProfileData,
      mockAddressData,
    );

    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(personProfileRepository.create).toHaveBeenCalledWith(
      mockDataProfile,
    );
    expect(personAddressRepository.create).toHaveBeenCalledWith(
      mockDataAddress,
    );
    expect(mockResult).toEqual({
      ...mockDataProfile,
      address: mockDataAddress,
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil do usuário criado com sucesso.',
      {
        authUserId: mockAuthUserId,
      },
    );
  });
  test('deve gerar erro caso authUserId não for enviado', async () => {
    const mockAuthUserId = undefined;
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
    };

    try {
      await personService.createProfileService(
        mockAuthUserId,
        mockProfileData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(personProfileRepository.findByAuthUserId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário já passua um perfil', async () => {
    const mockAuthUserId = 'user123';
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
    };

    personProfileRepository.findByAuthUserId.mockResolvedValue({
      authUserId: mockAuthUserId,
      photoKey: null,
    });

    try {
      await personService.createProfileService(
        mockAuthUserId,
        mockProfileData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário já possui perfil cadastrado.');
    }

    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de criar perfil já existente.',
      { authUserId: mockAuthUserId },
    );
    expect(personProfileRepository.create).not.toHaveBeenCalled();
  });
});

describe('personService - uploadPhotoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve fazer primeiro upload da foto do usuário com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = {
      buffer: Buffer.from('image-fake-content'),
      originalname: 'photo.jpeg',
    };
    const mockExistingProfile = {
      authUserId: mockAuthUserId,
      photoKey: null,
    };
    const mockKey = 'person-profiles/user123/photo.jpeg';
    const mockPhotoKey = 'person-profiles/user123/photo.jpeg';
    const mockUpdatedProfilePhoto = {
      authUserId: mockAuthUserId,
      photoKey: mockPhotoKey,
    };

    personProfileRepository.findByAuthUserId.mockResolvedValue(
      mockExistingProfile,
    );

    uploadFile.mockResolvedValue(mockPhotoKey);

    personProfileRepository.updatePhoto.mockResolvedValue(
      mockUpdatedProfilePhoto,
    );

    const mockResult = await personService.uploadPhotoService(
      mockAuthUserId,
      mockFileData,
    );

    expect(mockResult).toEqual(mockUpdatedProfilePhoto);
    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(deleteFile).not.toHaveBeenCalled();
    expect(uploadFile).toHaveBeenCalledWith(mockFileData.buffer, mockKey);
    expect(personProfileRepository.updatePhoto).toHaveBeenCalledWith(
      mockAuthUserId,
      mockPhotoKey,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Foto do usuário carregada com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve deletar foto antiga e fazer upload da nova foto do usuário com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = {
      buffer: Buffer.from('image-fake-content'),
      originalname: 'photo.jpeg',
    };
    const mockExistingProfile = {
      authUserId: mockAuthUserId,
      photoKey: 'person-profiles/user123/old-photo.jpeg',
    };
    const mockKey = 'person-profiles/user123/photo.jpeg';
    const mockPhotoKey = 'person-profiles/user123/photo.jpeg';
    const mockUpdatedProfilePhoto = {
      authUserId: mockAuthUserId,
      photoKey: mockPhotoKey,
    };

    personProfileRepository.findByAuthUserId.mockResolvedValue(
      mockExistingProfile,
    );

    deleteFile.mockResolvedValue();

    uploadFile.mockResolvedValue(mockPhotoKey);

    personProfileRepository.updatePhoto.mockResolvedValue(
      mockUpdatedProfilePhoto,
    );

    const mockResult = await personService.uploadPhotoService(
      mockAuthUserId,
      mockFileData,
    );

    expect(mockResult).toEqual(mockUpdatedProfilePhoto);
    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(deleteFile).toHaveBeenCalledWith(mockExistingProfile.photoKey);
    expect(uploadFile).toHaveBeenCalledWith(mockFileData.buffer, mockKey);
    expect(personProfileRepository.updatePhoto).toHaveBeenCalledWith(
      mockAuthUserId,
      mockPhotoKey,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Foto do usuário carregada com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve gerar erro caso algum parâmetro não for enviado', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = undefined;

    try {
      await personService.uploadPhotoService(mockAuthUserId, mockFileData);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(personProfileRepository.findByAuthUserId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = {
      buffer: Buffer.from('image-fake-content'),
      originalname: 'photo.jpeg',
    };

    personProfileRepository.findByAuthUserId.mockResolvedValue(null);

    try {
      await personService.uploadPhotoService(mockAuthUserId, mockFileData);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Perfil do usuário não encontrado.',
      { authUserId: mockAuthUserId },
    );
    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });
});

describe('personService - updateProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar perfil do usuário com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
    };
    const mockDataProfile = {
      phone: mockProfileData.phone,
      bio: mockProfileData.bio,
    };
    const mockDataAddress = {
      street: mockAddressData.street,
      number: mockAddressData.number,
      complement: mockAddressData.complement,
      neighborhood: mockAddressData.neighborhood,
      city: mockAddressData.city,
      state: mockAddressData.state,
      zipCode: mockAddressData.zipCode,
    };
    personProfileRepository.findByAuthUserId.mockResolvedValue({
      authUserId: mockAuthUserId,
      photoKey: null,
    });

    personProfileRepository.update.mockResolvedValue(mockDataProfile);

    personAddressRepository.update.mockResolvedValue(mockDataAddress);

    const mockResult = await personService.updateProfileService(
      mockAuthUserId,
      mockProfileData,
      mockAddressData,
    );

    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(personProfileRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockProfileData,
    );
    expect(personAddressRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockAddressData,
    );
    expect(mockResult).toEqual({
      ...mockDataProfile,
      address: mockDataAddress,
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil do usuário atualizado com sucesso.',
      {
        authUserId: mockAuthUserId,
      },
    );
  });
  test('deve gerar erro caso authUserId não for enviado', async () => {
    const mockUserId = undefined;
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
    };

    try {
      await personService.updateProfileService(
        mockUserId,
        mockProfileData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(personProfileRepository.findByAuthUserId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockAuthUserId = 'user123';
    const mockProfileData = {
      phone: '67998675431',
      bio: null,
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
    };

    personProfileRepository.findByAuthUserId.mockResolvedValue(null);

    try {
      await personService.updateProfileService(
        mockAuthUserId,
        mockProfileData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Perfil do usuário não encontrado.',
      { authUserId: mockAuthUserId },
    );
    expect(personProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(personProfileRepository.update).not.toHaveBeenCalled();
  });
});

describe('personService - getMyProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockMyProfile = {
      authUserId: mockAuthUserId,
      phone: '23567890534',
      photoKey: 'person-profiles/user123/photo.jpeg',
      bio: null,
      personId: mockAuthUserId,
      street: 'Rua fake',
      number: ' 23',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      zipCode: '37654178',
      type: CurriculumType.UPLOAD,
      fileKey: 'curriculums/user123/me.pdf',
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };

    personProfileRepository.getMyProfile.mockResolvedValue(mockMyProfile);

    const mockResult = await personService.getMyProfileService(
      mockAuthUserId,
      mockAccountType,
    );

    expect(personProfileRepository.getMyProfile).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(mockResult).toEqual(mockMyProfile);
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil do usuário encontrado com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve gerar erro caso algum parâmetro esteja ausente', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = undefined;

    try {
      await personService.getMyProfileService(mockAuthUserId, mockAccountType);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(personProfileRepository.getMyProfile).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil não seja de um usuário', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'COMPANY';
    try {
      await personService.getMyProfileService(mockAuthUserId, mockAccountType);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith('Usuário não possui permissão', {
      authUserId: mockAuthUserId,
      accountType: mockAccountType,
    });
    expect(personProfileRepository.getMyProfile).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';

    personProfileRepository.getMyProfile.mockResolvedValue(null);

    try {
      await personService.getMyProfileService(mockAuthUserId, mockAccountType);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(personProfileRepository.getMyProfile).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Perfil do usuário não encontrado.',
      { authUserId: mockAuthUserId },
    );
  });
});

describe('personService - getPublicProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil do usuário com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockPersonId = 'person123';
    const mockProfile = {
      photoKey: 'person-profiles/user123/photo.jpeg',
      bio: null,
      neighborhood: 'Bairro fake',
      city: 'Poços de Caldas',
      state: 'MG',
      type: CurriculumType.UPLOAD,
      fileKey: 'curriculums/user123/me.pdf',
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };

    personProfileRepository.getPublicProfile.mockResolvedValue(mockProfile);

    const mockResult = await personService.getPublicProfileService(
      mockAuthUserId,
      mockPersonId,
    );

    expect(personProfileRepository.getPublicProfile).toHaveBeenCalledWith(
      mockPersonId,
    );
    expect(mockResult).toEqual(mockProfile);
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil do usuário encontrado com sucesso.',
      {
        authUserId: mockAuthUserId,
        personId: mockPersonId,
      },
    );
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockAuthUserId = 'user123';
    const mockPersonId = undefined;

    try {
      await personService.getPublicProfileService(mockAuthUserId, mockPersonId);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(personProfileRepository.getPublicProfile).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso perfil do usuário não seja encontrado', async () => {
    const mockAuthUserId = 'user123';
    const mockPersonId = 'person123';

    personProfileRepository.getPublicProfile.mockResolvedValue(null);

    try {
      await personService.getPublicProfileService(mockAuthUserId, mockPersonId);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil do usuário não encontrado.');
    }

    expect(personProfileRepository.getPublicProfile).toHaveBeenCalledWith(
      mockPersonId,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});

describe('personService - uploadCurriculumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve fazer upload do currículo com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockFileData = {
      buffer: Buffer.from('fake-curriculo-content'),
      originalname: 'curriculo.pdf',
    };
    const mockKey = 'curriculums/user123/curriculo.pdf';
    const mockDataCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.UPLOAD,
      fileKey: mockKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };
    const mockUploadedCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.UPLOAD,
      fileKey: mockKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };

    curriculumRepository.findByPersonId.mockResolvedValue(null);

    uploadFile.mockResolvedValue(mockKey);

    curriculumRepository.upsert.mockResolvedValue(mockDataCurriculum);

    const mockResult = await personService.uploadCurriculumService(
      mockAuthUserId,
      mockAccountType,
      mockFileData,
    );

    expect(mockResult).toEqual(mockUploadedCurriculum);
    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(deleteFile).not.toHaveBeenCalled();
    expect(uploadFile).toHaveBeenCalledWith(mockFileData.buffer, mockKey);
    expect(curriculumRepository.upsert).toHaveBeenCalledWith(
      mockDataCurriculum,
    );
    expect(logger.info).toHaveBeenCalledWith('Currículo enviado com sucesso.', {
      authUserId: mockAuthUserId,
    });
  });
  test('deve deletar antigo e fazer upload do currículo com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockFileData = {
      buffer: Buffer.from('fake-curriculo-content'),
      originalname: 'curriculo.pdf',
    };
    const mockKey = 'curriculums/user123/curriculo.pdf';
    const mockDataCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.UPLOAD,
      fileKey: mockKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };
    const mockOldFileKey = 'curriculums/user123/joao.pdf';
    const mockExistingCurriculum = {
      type: CurriculumType.UPLOAD,
      fileKey: mockOldFileKey,
    };
    const mockUploadedCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.UPLOAD,
      fileKey: mockKey,
      professionalSummary: null,
      experiences: null,
      educations: null,
      courses: null,
      skills: null,
      observations: null,
    };

    curriculumRepository.findByPersonId.mockResolvedValue(
      mockExistingCurriculum,
    );

    deleteFile.mockResolvedValue();

    uploadFile.mockResolvedValue(mockKey);

    curriculumRepository.upsert.mockResolvedValue(mockDataCurriculum);

    const mockResult = await personService.uploadCurriculumService(
      mockAuthUserId,
      mockAccountType,
      mockFileData,
    );

    expect(mockResult).toEqual(mockUploadedCurriculum);
    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(deleteFile).toHaveBeenCalledWith(mockExistingCurriculum.fileKey);
    expect(uploadFile).toHaveBeenCalledWith(mockFileData.buffer, mockKey);
    expect(curriculumRepository.upsert).toHaveBeenCalledWith(
      mockDataCurriculum,
    );
    expect(logger.info).toHaveBeenCalledWith('Currículo enviado com sucesso.', {
      authUserId: mockAuthUserId,
    });
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = undefined;
    const mockFileData = {
      buffer: Buffer.from('fake-curriculo-content'),
      originalname: 'curriculo.pdf',
    };

    try {
      await personService.uploadCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockFileData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(curriculumRepository.findByPersonId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso usuário for diferente de PERSON', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'COMPANY';
    const mockFileData = {
      buffer: Buffer.from('fake-curriculo-content'),
      originalname: 'curriculo.pdf',
    };

    try {
      await personService.uploadCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockFileData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário sem permissão para upload.',
      { authUserId: mockAuthUserId, accountType: mockAccountType },
    );
    expect(curriculumRepository.findByPersonId).not.toHaveBeenCalled();
  });
});

describe('personService - createPlatformCurriculumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar currículo com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockDataCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };
    const mockPlatformCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };

    curriculumRepository.findByPersonId.mockResolvedValue(null);

    curriculumRepository.upsert.mockResolvedValue(mockDataCurriculum);

    const mockResult = await personService.createPlatformCurriculumService(
      mockAuthUserId,
      mockAccountType,
      mockCurriculumData,
    );

    expect(mockResult).toEqual(mockPlatformCurriculum);
    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(deleteFile).not.toHaveBeenCalled();
    expect(curriculumRepository.upsert).toHaveBeenCalledWith(
      mockDataCurriculum,
    );
    expect(logger.info).toHaveBeenCalledWith('Currículo criado com sucesso.', {
      authUserId: mockAuthUserId,
    });
  });
  test('deve substituir currículo em PDF por currículo da plataforma', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockDataCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };
    const mockPlatformCurriculum = {
      personId: mockAuthUserId,
      type: CurriculumType.PLATFORM,
      fileKey: null,
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };
    const mockFileKey = 'curriculums/user123/upload.pdf';
    const mockCurriculumExist = {
      type: CurriculumType.UPLOAD,
      fileKey: mockFileKey,
    };

    curriculumRepository.findByPersonId.mockResolvedValue(mockCurriculumExist);

    deleteFile.mockResolvedValue();

    curriculumRepository.upsert.mockResolvedValue(mockDataCurriculum);

    const mockResult = await personService.createPlatformCurriculumService(
      mockAuthUserId,
      mockAccountType,
      mockCurriculumData,
    );

    expect(mockResult).toEqual(mockPlatformCurriculum);
    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(deleteFile).toHaveBeenCalledWith(mockCurriculumExist.fileKey);
    expect(curriculumRepository.upsert).toHaveBeenCalledWith(
      mockDataCurriculum,
    );
    expect(logger.info).toHaveBeenCalledWith('Currículo criado com sucesso.', {
      authUserId: mockAuthUserId,
    });
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = undefined;

    try {
      await personService.createPlatformCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(curriculumRepository.findByPersonId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso usuário for diferente de PERSON', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'Company';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };

    try {
      await personService.createPlatformCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário sem permissão para criar currículo.',
      { authUserId: mockAuthUserId, accountType: mockAccountType },
    );
    expect(curriculumRepository.findByPersonId).not.toHaveBeenCalled();
  });
});

describe('personService - updatePlatformCurriculumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar currículo com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockExistingCurriculum = {
      fileKey: null,
      type: CurriculumType.PLATFORM,
    };
    const mockDataCurriculum = {
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };
    const mockUpdatedCurriculum = {
      professionalSummary: mockCurriculumData.professionalSummary,
      experiences: mockCurriculumData.experiences,
      educations: mockCurriculumData.educations,
      courses: mockCurriculumData.courses,
      skills: mockCurriculumData.skills,
      observations: mockCurriculumData.observations,
    };

    curriculumRepository.findByPersonId.mockResolvedValue(
      mockExistingCurriculum,
    );

    curriculumRepository.update.mockResolvedValue(mockUpdatedCurriculum);

    const mockResult = await personService.updatePlatformCurriculumService(
      mockAuthUserId,
      mockAccountType,
      mockCurriculumData,
    );

    expect(mockResult).toEqual(mockUpdatedCurriculum);
    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(curriculumRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockDataCurriculum,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Currículo atualizado com sucesso.',
      {
        authUserId: mockAuthUserId,
      },
    );
  });
  test('deve gerar erro caso algum parâmetro estiver ausente', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = undefined;

    try {
      await personService.updatePlatformCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(curriculumRepository.findByPersonId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o usuário for diferente de PERSON', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'COMPANY';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };

    try {
      await personService.updatePlatformCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário sem permissão para atualizar currículo.',
      { authUserId: mockAuthUserId, accountType: mockAccountType },
    );
    expect(curriculumRepository.findByPersonId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso não encontre currículo', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };

    curriculumRepository.findByPersonId.mockResolvedValue(null);

    try {
      await personService.updatePlatformCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Currículo não encontrado.');
    }

    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.warn).toHaveBeenCalledWith('Currículo não encontrado.', {
      authUserId: mockAuthUserId,
    });
    expect(curriculumRepository.update).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso tipo do currículo seja diferente de PLATFORM', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';
    const mockCurriculumData = {
      professionalSummary: 'Fake Summary',
      experiences: 'Fake experiences',
      educations: 'Fake educations',
      courses: 'Fake courses',
      skills: 'Fake skills',
      observations: 'Fake observations',
    };
    const mockExistingCurriculum = {
      fileKey: 'curriculums/user123/upload.pdf',
      type: CurriculumType.UPLOAD,
    };

    curriculumRepository.findByPersonId.mockResolvedValue(
      mockExistingCurriculum,
    );

    try {
      await personService.updatePlatformCurriculumService(
        mockAuthUserId,
        mockAccountType,
        mockCurriculumData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(
        'Este tipo de currículo não aceita atualizações.',
      );
    }

    expect(curriculumRepository.findByPersonId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.warn).toHaveBeenCalledWith('Tipo de currículo diferente.', {
      authUserId: mockAuthUserId,
    });
    expect(curriculumRepository.update).not.toHaveBeenCalled();
  });
});
