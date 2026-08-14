jest.mock('../../../src/storage/uploadFile', () => jest.fn());
jest.mock('../../../src/storage/deleteFile', () => jest.fn());
jest.mock('../../../src/repositories', () => ({
  companyProfileRepository: {
    findByAuthUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getMyProfile: jest.fn(),
    getPublicProfile: jest.fn(),
  },
  companyAddressRepository: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const companyService = require('../../../src/services/companyService');
const {
  companyProfileRepository,
  companyAddressRepository,
} = require('../../../src/repositories');
const uploadFile = require('../../../src/storage/uploadFile');
const deleteFile = require('../../../src/storage/deleteFile');
const AppError = require('../../../errors/AppError');
const logger = require('../../../src/config/logger');

describe('companyService - createProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar perfil da empresa com sucesso mas sem upload da logo', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = undefined;
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };
    const mockDataCompany = {
      authUserId: mockAuthUserId,
      companyName: 'empresa',
      phone: '12456780965',
      logoKey: null,
      bio: 'fake bio',
    };
    const mockDataAddress = {
      companyId: mockAuthUserId,
      street: mockAddressData.street,
      number: mockAddressData.number,
      complement: mockAddressData.complement,
      neighborhood: mockAddressData.neighborhood,
      city: mockAddressData.city,
      state: mockAddressData.state,
      zipCode: mockAddressData.zipCode,
    };

    companyProfileRepository.findByAuthUserId.mockResolvedValue(null);

    companyProfileRepository.create.mockResolvedValue(mockDataCompany);

    companyAddressRepository.create.mockResolvedValue(mockDataAddress);

    const mockResult = await companyService.createProfileService(
      mockAuthUserId,
      mockFileData,
      mockCompanyData,
      mockAddressData,
    );

    expect(mockResult).toEqual({
      ...mockDataCompany,
      address: mockDataAddress,
    });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(companyProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(companyProfileRepository.create).toHaveBeenCalledWith(
      mockDataCompany,
    );
    expect(companyAddressRepository.create).toHaveBeenCalledWith(
      mockDataAddress,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil da empresa criado com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve criar perfil da empresa com sucesso com upload da logo', async () => {
    const mockAuthUserId = 'user123';
    const mockKey = 'company-profiles/user123/logo.jpeg';
    const mockLogoKey = mockKey;
    const mockFileData = {
      buffer: Buffer.from('logo-fake-content'),
      originalname: 'logo.jpeg',
    };
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };
    const mockDataCompany = {
      authUserId: mockAuthUserId,
      companyName: 'empresa',
      phone: '12456780965',
      logoKey: mockLogoKey,
      bio: 'fake bio',
    };
    const mockDataAddress = {
      companyId: mockAuthUserId,
      street: mockAddressData.street,
      number: mockAddressData.number,
      complement: mockAddressData.complement,
      neighborhood: mockAddressData.neighborhood,
      city: mockAddressData.city,
      state: mockAddressData.state,
      zipCode: mockAddressData.zipCode,
    };

    companyProfileRepository.findByAuthUserId.mockResolvedValue(null);

    uploadFile.mockResolvedValue(mockLogoKey);

    companyProfileRepository.create.mockResolvedValue(mockDataCompany);

    companyAddressRepository.create.mockResolvedValue(mockDataAddress);

    const mockResult = await companyService.createProfileService(
      mockAuthUserId,
      mockFileData,
      mockCompanyData,
      mockAddressData,
    );

    expect(mockResult).toEqual({
      ...mockDataCompany,
      address: mockDataAddress,
    });
    expect(uploadFile).toHaveBeenCalledWith(mockFileData.buffer, mockKey);
    expect(companyProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(companyProfileRepository.create).toHaveBeenCalledWith(
      mockDataCompany,
    );
    expect(companyAddressRepository.create).toHaveBeenCalledWith(
      mockDataAddress,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil da empresa criado com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve gerar erro caso authUserId não for enviado', async () => {
    const mockAuthUserId = undefined;
    const mockFileData = undefined;
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };

    try {
      await companyService.createProfileService(
        mockAuthUserId,
        mockFileData,
        mockCompanyData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(companyProfileRepository.findByAuthUserId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a empresa já passua um perfil', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = undefined;
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };
    const mockExistingProfile = {
      authUserId: mockAuthUserId,
      logoKey: null,
    };

    companyProfileRepository.findByAuthUserId.mockResolvedValue(
      mockExistingProfile,
    );

    try {
      await companyService.createProfileService(
        mockAuthUserId,
        mockFileData,
        mockCompanyData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Empresa já possui perfil cadastrado.');
    }

    expect(companyProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de criar perfil já existente.',
      { authUserId: mockAuthUserId },
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });
});

describe('companyService - updateProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar perfil da empresa com sucesso mas sem upload da logo', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = undefined;
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };
    const mockCompanyProfile = {
      authUserId: mockAuthUserId,
      logoKey: null,
    };
    const mockDataCompany = {
      companyName: mockCompanyData.companyName,
      phone: mockCompanyData.phone,
      bio: mockCompanyData.bio,
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
    const mockUpdatedDataCompany = {
      companyName: mockCompanyData.companyName,
      phone: mockCompanyData.phone,
      logoKey: null,
      bio: mockCompanyData.bio,
    };

    companyProfileRepository.findByAuthUserId.mockResolvedValue(
      mockCompanyProfile,
    );

    companyProfileRepository.update.mockResolvedValue(mockUpdatedDataCompany);

    companyAddressRepository.update.mockResolvedValue(mockDataAddress);

    const mockResult = await companyService.updateProfileService(
      mockAuthUserId,
      mockFileData,
      mockCompanyData,
      mockAddressData,
    );

    expect(mockResult).toEqual({
      ...mockUpdatedDataCompany,
      address: mockDataAddress,
    });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(companyProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(companyProfileRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockDataCompany,
    );
    expect(companyAddressRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockDataAddress,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil da empresa atualizado com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve atualizar perfil da empresa com sucesso com upload da logo', async () => {
    const mockAuthUserId = 'user123';
    const mockKey = 'company-profiles/user123/logo.jpeg';
    const mockOldLogoKey = 'company-profiles/user123/old-logo.jpeg';
    const mockLogoKey = mockKey;
    const mockFileData = {
      buffer: Buffer.from('logo-fake-content'),
      originalname: 'logo.jpeg',
    };
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };
    const mockDataCompany = {
      companyName: mockCompanyData.companyName,
      phone: mockCompanyData.phone,
      logoKey: mockLogoKey,
      bio: mockCompanyData.bio,
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
    const mockCompanyProfile = {
      authUserId: mockAuthUserId,
      logoKey: mockOldLogoKey,
    };
    companyProfileRepository.findByAuthUserId.mockResolvedValue(
      mockCompanyProfile,
    );

    deleteFile.mockResolvedValue();

    uploadFile.mockResolvedValue(mockLogoKey);

    companyProfileRepository.update.mockResolvedValue(mockDataCompany);

    companyAddressRepository.update.mockResolvedValue(mockDataAddress);

    const mockResult = await companyService.updateProfileService(
      mockAuthUserId,
      mockFileData,
      mockCompanyData,
      mockAddressData,
    );

    expect(mockResult).toEqual({
      ...mockDataCompany,
      address: mockDataAddress,
    });
    expect(deleteFile).toHaveBeenCalledWith(mockCompanyProfile.logoKey);
    expect(uploadFile).toHaveBeenCalledWith(mockFileData.buffer, mockKey);
    expect(companyProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(companyProfileRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockDataCompany,
    );
    expect(companyAddressRepository.update).toHaveBeenCalledWith(
      mockAuthUserId,
      mockDataAddress,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil da empresa atualizado com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve gerar erro caso authUserId não for enviado', async () => {
    const mockAuthUserId = undefined;
    const mockFileData = undefined;
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };

    try {
      await companyService.updateProfileService(
        mockAuthUserId,
        mockFileData,
        mockCompanyData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(companyProfileRepository.findByAuthUserId).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o perfil da empresa não seja encontrado', async () => {
    const mockAuthUserId = 'user123';
    const mockFileData = undefined;
    const mockCompanyData = {
      companyName: 'empresa',
      phone: '12456780965',
      bio: 'fake bio',
    };
    const mockAddressData = {
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };

    companyProfileRepository.findByAuthUserId.mockResolvedValue(null);

    try {
      await companyService.updateProfileService(
        mockAuthUserId,
        mockFileData,
        mockCompanyData,
        mockAddressData,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil da empresa não encontrado.');
    }

    expect(companyProfileRepository.findByAuthUserId).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.warn).toHaveBeenCalledWith('Empresa não encontrada.', {
      authUserId: mockAuthUserId,
    });
    expect(uploadFile).not.toHaveBeenCalled();
  });
});

describe('comapnyService - getMyProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil da empresa com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'COMPANY';
    const mockMyProfile = {
      authUserId: mockAuthUserId,
      companyName: 'empresa',
      phone: '12456780965',
      logoKey: null,
      bio: 'fake bio',
      companyId: mockAuthUserId,
      street: 'Rua fake',
      number: '12',
      complement: null,
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
      zipCode: '12345213',
    };

    companyProfileRepository.getMyProfile.mockResolvedValue(mockMyProfile);

    const result = await companyService.getMyProfileService(
      mockAuthUserId,
      mockAccountType,
    );

    expect(result).toEqual(mockMyProfile);
    expect(companyProfileRepository.getMyProfile).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil da empresa encontrado com sucesso.',
      { authUserId: mockAuthUserId },
    );
  });
  test('deve gerar erro caso algum parâmetro não seja enviado', async () => {
    const mockAuthUserId = undefined;
    const mockAccountType = 'COMPANY';

    try {
      await companyService.getMyProfileService(mockAuthUserId, mockAccountType);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(companyProfileRepository.getMyProfile).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o accountType seja diferente de COMPANY', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'PERSON';

    try {
      await companyService.getMyProfileService(mockAuthUserId, mockAccountType);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Usuário não possui permissão.');
    }

    expect(logger.warn).toHaveBeenCalledWith('Usuário não possui permissão.', {
      authUserId: mockAuthUserId,
      accountType: mockAccountType,
    });
    expect(companyProfileRepository.getMyProfile).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o perfil da empresa não seja encontrado.', async () => {
    const mockAuthUserId = 'user123';
    const mockAccountType = 'COMPANY';

    companyProfileRepository.getMyProfile.mockResolvedValue(null);

    try {
      await companyService.getMyProfileService(mockAuthUserId, mockAccountType);

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil da empresa não encontrado.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Perfil da empresa não encontrado.',
      { authUserId: mockAuthUserId },
    );
    expect(companyProfileRepository.getMyProfile).toHaveBeenCalledWith(
      mockAuthUserId,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});

describe('comapnyService - getPublicProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil da empresa com sucesso', async () => {
    const mockAuthUserId = 'user123';
    const mockCompanyId = 'company123';
    const mockPublicProfile = {
      companyName: 'empresa',
      logoKey: null,
      bio: 'fake bio',
      neighborhood: 'Bairro fake',
      city: 'Cidade fake',
      state: 'MG',
    };

    companyProfileRepository.getPublicProfile.mockResolvedValue(
      mockPublicProfile,
    );

    const result = await companyService.getPublicProfileService(
      mockAuthUserId,
      mockCompanyId,
    );

    expect(result).toEqual(mockPublicProfile);
    expect(companyProfileRepository.getPublicProfile).toHaveBeenCalledWith(
      mockCompanyId,
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Perfil da empresa encontrado com sucesso.',
      { authUserId: mockAuthUserId, companyId: mockCompanyId },
    );
  });
  test('deve gerar erro caso algum parâmetro não seja enviado', async () => {
    const mockAuthUserId = undefined;
    const mockCompanyId = 'company123';

    try {
      await companyService.getPublicProfileService(
        mockAuthUserId,
        mockCompanyId,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Dados inválidos.');
    }

    expect(companyProfileRepository.getPublicProfile).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o perfil da empresa não seja encontrado.', async () => {
    const mockAuthUserId = 'user123';
    const mockCompanyId = 'company123';

    companyProfileRepository.getPublicProfile.mockResolvedValue(null);

    try {
      await companyService.getPublicProfileService(
        mockAuthUserId,
        mockCompanyId,
      );

      fail('Deveria encerrar aqui.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Perfil da empresa não encontrado.');
    }

    expect(logger.warn).toHaveBeenCalledWith(
      'Perfil da empresa não encontrado.',
      { authUserId: mockAuthUserId, companyId: mockCompanyId },
    );
    expect(companyProfileRepository.getPublicProfile).toHaveBeenCalledWith(
      mockCompanyId,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});
