jest.mock('../../../src/services/companyService', () => ({
  createProfileService: jest.fn(),
  updateProfileService: jest.fn(),
  getMyProfileService: jest.fn(),
  getPublicProfileService: jest.fn(),
}));
jest.mock('../../../src/middlewares', () => ({
  asyncHandler: jest.fn((fn) => fn),
}));

const companyController = require('../../../src/controllers/companyController');
const companyService = require('../../../src/services/companyService');
const AppError = require('../../../errors/AppError');

describe('companyController - createProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar o perfil da empresa com logo com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('logo-fake-content'),
        originalname: 'logo.jpeg',
      },
      body: {
        companyData: {
          companyName: 'empresa',
          phone: '23765438972',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua',
          number: '23',
          complement: null,
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'FK',
          zipCode: '34567876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      authUserId: 'user123',
      companyName: 'empresa',
      phone: '23765438972',
      logoKey: 'company-profiles/user123/logo.jpeg',
      bio: 'bio fake',
      address: {
        companyId: 'user123',
        street: 'Rua',
        number: '23',
        complement: null,
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'FK',
        zipCode: '34567876',
      },
    };

    companyService.createProfileService.mockResolvedValue(mockResponse);

    await companyController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(companyService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.companyData,
      mockReq.body.addressData,
    );
  });
  test('deve criar o perfil da empresa sem logo com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: undefined,
      body: {
        companyData: {
          companyName: 'empresa',
          phone: '23765438972',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua',
          number: '23',
          complement: null,
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'FK',
          zipCode: '34567876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      authUserId: 'user123',
      companyName: 'empresa',
      phone: '23765438972',
      logoKey: null,
      bio: 'bio fake',
      address: {
        companyId: 'user123',
        street: 'Rua',
        number: '23',
        complement: null,
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'FK',
        zipCode: '34567876',
      },
    };

    companyService.createProfileService.mockResolvedValue(mockResponse);

    await companyController.createProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(companyService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.companyData,
      mockReq.body.addressData,
    );
  });
  test('deve propagar o AppError retornado pelo createProfileService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('logo-fake-content'),
        originalname: 'logo.jpeg',
      },
      body: {
        companyData: {
          companyName: 'empresa',
          phone: '23765438972',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua',
          number: '23',
          complement: null,
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'FK',
          zipCode: '34567876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    companyService.createProfileService.mockRejectedValue(
      new AppError('Empresa já possui perfil cadastrado.', 409),
    );

    await expect(
      companyController.createProfile(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(companyService.createProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.companyData,
      mockReq.body.addressData,
    );
  });
});

describe('companyController - updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve atualizar perfil da empresa com logo com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: {
        buffer: Buffer.from('logo-fake-content'),
        originalname: 'logo.jpeg',
      },
      body: {
        companyData: {
          companyName: 'empresa',
          phone: '23765438972',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua',
          number: '23',
          complement: null,
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'FK',
          zipCode: '34567876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      companyName: 'empresa',
      phone: '23765438972',
      logoKey: 'company-profiles/user123/logo.jpeg',
      bio: 'bio fake',
      address: {
        street: 'Rua',
        number: '23',
        complement: null,
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'FK',
        zipCode: '34567876',
      },
    };

    companyService.updateProfileService.mockResolvedValue(mockResponse);

    await companyController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(companyService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.companyData,
      mockReq.body.addressData,
    );
  });
  test('deve atualizar perfil da empresa sem logo com sucesso.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      file: undefined,
      body: {
        companyData: {
          companyName: 'empresa',
          phone: '23765438972',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua',
          number: '23',
          complement: null,
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'FK',
          zipCode: '34567876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockResponse = {
      companyName: 'empresa',
      phone: '23765438972',
      logoKey: null,
      bio: 'bio fake',
      address: {
        street: 'Rua',
        number: '23',
        complement: null,
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'FK',
        zipCode: '34567876',
      },
    };

    companyService.updateProfileService.mockResolvedValue(mockResponse);

    await companyController.updateProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(companyService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.companyData,
      mockReq.body.addressData,
    );
  });
  test('deve propagar o AppError retornado pelo updateProfileService.', async () => {
    const mockReq = {
      user: { id: 'user123' },
      file: {
        buffer: Buffer.from('logo-fake-content'),
        originalname: 'logo.jpeg',
      },
      body: {
        companyData: {
          companyName: 'empresa',
          phone: '23765438972',
          bio: 'bio fake',
        },
        addressData: {
          street: 'Rua',
          number: '23',
          complement: null,
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'FK',
          zipCode: '34567876',
        },
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    companyService.updateProfileService.mockRejectedValue(
      new AppError('Perfil da empresa não encontrado.', 404),
    );

    await expect(
      companyController.updateProfile(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(companyService.updateProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.file,
      mockReq.body.companyData,
      mockReq.body.addressData,
    );
  });
});

describe('companyController - myProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil da empresa com sucesso.', async () => {
    const mockResponse = {
      authUserId: 'user123',
      companyName: 'empresa',
      phone: '54678543215',
      logoKey: 'company-profiles/user123/logo.jpeg',
      bio: 'bio fake',
      address: {
        companyId: 'user123',
        street: 'Rua fake',
        number: '67',
        complement: null,
        neighborhood: 'Bairro fake',
        city: 'Cidade fake',
        state: 'FK',
        zipCode: '54321876',
      },
    };
    const mockReq = {
      user: {
        id: 'user123',
        accountType: 'COMPANY',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    companyService.getMyProfileService.mockResolvedValue(mockResponse);

    await companyController.myProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(companyService.getMyProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
    );
  });
  test('deve propagar o AppError retornado pelo getMyProfileService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
        accountType: 'COMPANY',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    companyService.getMyProfileService.mockRejectedValue(
      new AppError('Perfil da empresa não encontrado.', 404),
    );

    await expect(companyController.myProfile(mockReq, mockRes)).rejects.toThrow(
      AppError,
    );

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(companyService.getMyProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.user.accountType,
    );
  });
});

describe('companyController - publicProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve buscar o perfil da empresa com sucesso.', async () => {
    const mockResponse = {
      companyName: 'empresa',
      logoKey: 'company-profiles/user123/logo.jpeg',
      bio: 'Bio Fake',
      address: {
        city: 'Poços de Caldas',
        state: 'MG',
        neighborhood: 'Bairro Fake',
      },
    };
    const mockReq = {
      user: {
        id: 'user123',
      },
      params: {
        companyId: 'empresa123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    companyService.getPublicProfileService.mockResolvedValue(mockResponse);

    await companyController.publicProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    expect(companyService.getPublicProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.params.companyId,
    );
  });
  test('deve propagar o AppError retornado pelo getPublicProfileService.', async () => {
    const mockReq = {
      user: {
        id: 'user123',
      },
      params: {
        companyId: 'empresa123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    companyService.getPublicProfileService.mockRejectedValue(
      new AppError('Perfil da empresa não encontrado.', 404),
    );

    await expect(
      companyController.publicProfile(mockReq, mockRes),
    ).rejects.toThrow(AppError);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(companyService.getPublicProfileService).toHaveBeenCalledWith(
      mockReq.user.id,
      mockReq.params.companyId,
    );
  });
});
