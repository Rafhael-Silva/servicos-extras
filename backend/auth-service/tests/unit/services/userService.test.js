jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findByCpf: jest.fn(),
    findByCnpj: jest.fn(),
    createUser: jest.fn(),
  },
}));
jest.mock('../../../src/utils', () => ({
  normalizeEmail: jest.fn(),
}));

const { userService } = require('../../../src/services');
const { userRepository } = require('../../../src/repositories');
const { normalizeEmail } = require('../../../src/utils');
const { AccountType } = require('@prisma/client');

//Teste para verificar se o E-mail existe.
describe('userService - emailExists', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('deve retornar os dados do usuário com sucesso.', async () => {
    const mockEmail = 'TestE@example.com ';
    const mockNormalizedEmail = 'teste@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await userService.emailExists(mockEmail);

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(result).toEqual(mockUser);
  });
  test('deve gerar erro caso o e-mail não seja informado.', () => {
    const mockEmail = undefined;

    expect(() => userService.emailExists(mockEmail)).toThrow(
      'Dados inválidos.',
    );

    expect(normalizeEmail).not.toHaveBeenCalled();
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });
  test('deve retornar null caso e-mail não exista.', async () => {
    const mockEmail = ' teSte@example.com';
    const mockNormalizedEmail = 'teste@example.com';

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockResolvedValue(null);

    const result = await userService.emailExists(mockEmail);

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
    expect(result).toBeNull();
  });
  test('deve gerar erro caso a consulta ao DB falhe.', async () => {
    const mockEmail = ' joAo@example.Com';
    const mockNormalizedEmail = 'joao@example.com';

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.findByEmail.mockRejectedValue(
      new Error('Erro ao buscar E-mail.'),
    );

    await expect(userService.emailExists(mockEmail)).rejects.toThrow(
      'Erro ao buscar E-mail.',
    );

    expect(normalizeEmail).toHaveBeenCalledWith(mockEmail);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      mockNormalizedEmail,
    );
  });
});

//Teste para verificar se o CPF existe.
describe('userService - cpfExists', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar os dados do usuário com sucesso.', async () => {
    const mockCPF = '12345678900';
    const mockUser = {
      id: 'user123',
    };

    userRepository.findByCpf.mockResolvedValue(mockUser);

    const result = await userService.cpfExists(mockCPF);

    expect(userRepository.findByCpf).toHaveBeenCalledWith(mockCPF);
    expect(result).toEqual(mockUser);
  });
  test('deve gerar erro caso CPF não seja informado.', () => {
    const mockCPF = undefined;

    expect(() => userService.cpfExists(mockCPF)).toThrow('Dados inválidos.');

    expect(userRepository.findByCpf).not.toHaveBeenCalled();
  });
  test('deve retornar null caso CPF não exista.', async () => {
    const mockCPF = '12345678900';

    userRepository.findByCpf.mockResolvedValue(null);

    const result = await userService.cpfExists(mockCPF);

    expect(userRepository.findByCpf).toHaveBeenCalledWith(mockCPF);
    expect(result).toBeNull();
  });
  test('deve gerar erro caso a consulta ao DB falhe.', async () => {
    const mockCPF = '12345678900';

    userRepository.findByCpf.mockRejectedValue(
      new Error('Erro ao buscar CPF.'),
    );

    await expect(userService.cpfExists(mockCPF)).rejects.toThrow(
      'Erro ao buscar CPF.',
    );
    expect(userRepository.findByCpf).toHaveBeenCalledWith(mockCPF);
  });
});

//Teste para verificar se o CNPJ existe.
describe('userService - cnpjExists', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar os dados do usuário com sucesso.', async () => {
    const mockCNPJ = '12345678000199';
    const mockUser = {
      id: 'user123',
    };

    userRepository.findByCnpj.mockResolvedValue(mockUser);

    const result = await userService.cnpjExists(mockCNPJ);

    expect(userRepository.findByCnpj).toHaveBeenCalledWith(mockCNPJ);
    expect(result).toEqual(mockUser);
  });
  test('deve gerar erro caso o CNPJ não seja informado.', () => {
    const mockCNPJ = undefined;

    expect(() => userService.cnpjExists(mockCNPJ)).toThrow('Dados inválidos.');

    expect(userRepository.findByCnpj).not.toHaveBeenCalled();
  });
  test('deve retornar null caso CNPJ não exista.', async () => {
    const mockCNPJ = '12345678000199';

    userRepository.findByCnpj.mockResolvedValue(null);

    const result = await userService.cnpjExists(mockCNPJ);

    expect(userRepository.findByCnpj).toHaveBeenCalledWith(mockCNPJ);
    expect(result).toBeNull();
  });
  test('deve gerar erro caso a consulta ao DB falhe.', async () => {
    const mockCNPJ = '12345678000199';

    userRepository.findByCnpj.mockRejectedValue(
      new Error('Erro ao buscar CNPJ.'),
    );

    await expect(userService.cnpjExists(mockCNPJ)).rejects.toThrow(
      'Erro ao buscar CNPJ.',
    );
    expect(userRepository.findByCnpj).toHaveBeenCalledWith(mockCNPJ);
  });
});

//Teste que cria um usuário.
describe('userService - createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve criar um usuário com sucesso.', async () => {
    const mockNormalizedEmail = 'joao@example.com';
    const userData = {
      name: 'João',
      email: mockNormalizedEmail,
      passwordHash: 'hash-fake',
      accountType: AccountType.PERSON,
      cpf: '12345678900',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockSavedUser = {
      ...userData,
      id: 'fake_id',
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.createUser.mockResolvedValue(mockSavedUser);

    const result = await userService.createUser(userData);

    expect(normalizeEmail).toHaveBeenCalledWith(userData.email);
    expect(userRepository.createUser).toHaveBeenCalledWith(userData);
    expect(result).toEqual(mockSavedUser);
  });
  test('deve gerar erro caso accountType seja inválido.', () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'hash-fake',
      accountType: 'CANDIDATO',
      cnpj: '12345678900987',
      termsAccepted: true,
      birthDate: new Date('2000-05-23'),
    };

    expect(() => userService.createUser(userData)).toThrow(
      'Tipo de usuário inválido.',
    );

    expect(normalizeEmail).not.toHaveBeenCalled();
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso o armazenamento no DB falhe.', async () => {
    const mockNormalizedEmail = 'joao@example.com';
    const userData = {
      name: 'João',
      email: mockNormalizedEmail,
      passwordHash: 'hash-fake',
      accountType: AccountType.PERSON,
      cpf: '12345678900',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    normalizeEmail.mockReturnValue(mockNormalizedEmail);

    userRepository.createUser.mockRejectedValue(
      new Error('Erro ao criar usuário.'),
    );

    await expect(userService.createUser(userData)).rejects.toThrow(
      'Erro ao criar usuário.',
    );

    expect(normalizeEmail).toHaveBeenCalledWith(userData.email);
    expect(userRepository.createUser).toHaveBeenCalledWith(userData);
  });
});
