const authService = require('../../src/services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../../src/utils/sendEmail');
const prisma = require('../../src/config/prisma');
const { VerificationType, Prisma } = require('@prisma/client');
const sendWelcomeEmail = require('../../src/utils/sendWelcomeEmail');
const logger = require('../../src/config/logger');
const {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
} = require('../../src/utils/generateToken');

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../src/utils/generateToken', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generateVerificationToken: jest.fn(),
}));
jest.mock('../../src/utils/sendEmail', () => jest.fn());
jest.mock('../../src/utils/sendWelcomeEmail', () => jest.fn());
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  revokedToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  verificationCode: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}));

//Teste para verificar se o E-mail existe.
describe('authService - emailExists', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('deve retornar os dados do usuário se o e-mail existir', async () => {
    const mockEmail = 'TestE@example.com ';
    const mockNormalizedEmail = 'teste@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await authService.emailExists(mockEmail);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: mockNormalizedEmail } }),
    );
    expect(result).toEqual(mockUser);
  });
  test('deve lançar erro se e-mail não for informado.', async () => {
    const mockEmail = null;

    await expect(authService.emailExists(mockEmail)).rejects.toThrow(
      'Dado inválido.',
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  test('deve retornar null se e-mail não existir.', async () => {
    const mockEmail = ' teSte@example.com';
    const mockNormalizedEmail = 'teste@example.com';

    prisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.emailExists(mockEmail);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockNormalizedEmail },
      }),
    );
    expect(result).toEqual(null);
  });
  test('deve retornar erro se a consulta falhar.', async () => {
    const mockEmail = ' joAo@example.Com';
    const mockNormalizedEmail = 'joao@example.com';

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(authService.emailExists(mockEmail)).rejects.toThrow('Fail');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockNormalizedEmail },
      }),
    );
  });
});

//Teste para verificar se o CPF existe.
describe('authService - cpfExists', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar os dados do usuário se o CPF existir', async () => {
    const mockCPF = 12345678900;
    const mockNormalizedCPF = '12345678900';
    const mockUser = {
      id: 'user123',
      cpf: mockNormalizedCPF,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await authService.cpfExists(mockCPF);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { cpf: mockNormalizedCPF },
    });
    expect(result).toEqual(mockUser);
  });
  test('deve lançar erro se CPF não for informado.', async () => {
    const mockCPF = null;

    await expect(authService.cpfExists(mockCPF)).rejects.toThrow(
      'Dado inválido.',
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  test('deve retornar null se CPF não existir.', async () => {
    const mockCPF = 12345678900;
    const mockNormalizedCPF = '12345678900';

    prisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.cpfExists(mockCPF);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { cpf: mockNormalizedCPF },
    });
    expect(result).toBeNull();
  });
  test('deve lançar erro se a consulta falhar.', async () => {
    const mockCPF = 12345678900;
    const mockNormalizedCPF = '12345678900';

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(authService.cpfExists(mockCPF)).rejects.toThrow('Fail');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { cpf: mockNormalizedCPF },
    });
  });
});

//Teste para verificar se o CNPJ existe.
describe('authService - cnpjExists', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar os dados do usuário se o CNPJ existir', async () => {
    const mockCNPJ = 12345678000199;
    const mockNormalizedCNPJ = '12345678000199';
    const mockUser = {
      id: 'user123',
      cnpj: mockNormalizedCNPJ,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await authService.cnpjExists(mockCNPJ);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { cnpj: mockNormalizedCNPJ },
    });
    expect(result).toEqual(mockUser);
  });
  test('deve lançar erro se CNPJ não for informado.', async () => {
    const mockCNPJ = null;

    await expect(authService.cnpjExists(mockCNPJ)).rejects.toThrow(
      'Dado inválido.',
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  test('deve retornar null se CNPJ não existir.', async () => {
    const mockCNPJ = 12345678000199;
    const mockNormalizedCNPJ = '12345678000199';

    prisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.cnpjExists(mockCNPJ);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { cnpj: mockNormalizedCNPJ },
    });
    expect(result).toBeNull();
  });
  test('deve lançar erro se a consulta falhar.', async () => {
    const mockCNPJ = 12345678000199;
    const mockNormalizedCNPJ = '12345678000199';

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(authService.cnpjExists(mockCNPJ)).rejects.toThrow('Fail');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { cnpj: mockNormalizedCNPJ },
    });
  });
});

//Teste que verifica se usuário é de maior ou de menor.
describe('authService - isUserUnderAge', () => {
  test('deve retornar true para usuário menor de 18 anos', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 17);
    expect(authService.isUserUnderage(birthDate)).toBe(true);
  });

  test('deve retornar false para usuário com 18 anos ou mais', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 18);
    expect(authService.isUserUnderage(birthDate)).toBe(false);

    const olderBirthDate = new Date();
    olderBirthDate.setFullYear(olderBirthDate.getFullYear() - 25);
    expect(authService.isUserUnderage(olderBirthDate)).toBe(false);
  });
});

//Teste que devolve a idade do usuário.
describe('authService - calculateAge', () => {
  test('deve retornar 18 para alguém que completou 18 anos este ano', () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    expect(authService.calculateAge(birthDate)).toBe(18);
  });
  test('deve retornar 17 para alguém que ainda não completou 18 anos este ano', () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate() + 1,
    );
    expect(authService.calculateAge(birthDate)).toBe(17);
  });
  test('deve calcular corretamente para aniversários passados em outros meses', () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 25,
      today.getMonth() - 1,
      today.getDate(),
    );
    expect(authService.calculateAge(birthDate)).toBe(25);
  });
  test('deve calcular corretamente para aniversários futuros em outros meses', () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 25,
      today.getMonth() + 1,
      today.getDate(),
    );
    expect(authService.calculateAge(birthDate)).toBe(24);
  });
});

//Teste envio de código.
describe('authService - sendUserCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve gerar e enviar código com sucesso', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    prisma.verificationCode.count.mockResolvedValue(0);

    prisma.$transaction.mockResolvedValue();

    sendEmail.mockResolvedValue();

    const result = await authService.sendUserCode(
      mockUser,
      VerificationType.LOGIN,
    );

    const transactionArgs = prisma.$transaction.mock.calls[0][0];

    expect(result).toEqual({ message: 'Código enviado com sucesso.' });
    expect(prisma.verificationCode.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationType.LOGIN,
          used: false,
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      mockUser.email,
      'Seu código de verificação',
      expect.stringContaining('Seu código de verificação'),
      expect.any(String),
    );
    expect(Array.isArray(transactionArgs)).toBe(true);
    expect(transactionArgs).toHaveLength(2);
    expect(logger.info).toHaveBeenCalledWith(
      'Código enviado.',
      expect.objectContaining({
        userId: mockUser.id,
        type: VerificationType.LOGIN,
      }),
    );
  });
  test('deve gerar erro quando usuário não é informado.', async () => {
    const mockUser = null;

    await expect(
      authService.sendUserCode(mockUser, VerificationType.LOGIN),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  test('deve gerar erro ao atingir limite no envio de código.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    prisma.verificationCode.count.mockResolvedValue(5);

    await expect(
      authService.sendUserCode(mockUser, VerificationType.LOGIN),
    ).rejects.toThrow(
      'Aguarde alguns minutos antes de solicitar um novo código.',
    );

    expect(prisma.verificationCode.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationType.LOGIN,
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Limite de envio de código atingido.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  test('deve lançar erro quando sendEmail falhar.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    prisma.verificationCode.count.mockResolvedValue(0);

    prisma.$transaction.mockResolvedValue();

    sendEmail.mockRejectedValue(new Error('Erro ao enviar e-mail.'));

    await expect(
      authService.sendUserCode(mockUser, VerificationType.LOGIN),
    ).rejects.toThrow('Erro ao enviar e-mail.');

    expect(prisma.verificationCode.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationType.LOGIN,
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve lançar erro quando $transaction falhar', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    prisma.verificationCode.count.mockResolvedValue(0);

    prisma.$transaction.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.sendUserCode(mockUser, VerificationType.LOGIN),
    ).rejects.toThrow('Fail');

    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});

//Teste de reenvio de código.
describe('authService - resendCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve reenviar o código com sucesso.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockResolvedValue(0);

    prisma.$transaction.mockResolvedValue();

    sendEmail.mockResolvedValue();

    const result = await authService.resendCodeService(
      mockUser.email,
      VerificationType.PASSWORD_RESET,
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockUser.email },
      select: {
        id: true,
        email: true,
      },
    });
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      message: 'Código reenviado. Verifique seu e-mail.',
    });
  });
  test('deve gerar erro se os dados de entrada forem inválidos.', async () => {
    const mockEmail = 'joao@example.com';
    const mockType = undefined;

    await expect(
      authService.resendCodeService(mockEmail, mockType),
    ).rejects.toThrow('Dados inválidos');
  });
  test('deve gerar erro caso haja falha no DB.', async () => {
    const mockEmail = 'joao@example.com';

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.resendCodeService(mockEmail, VerificationType.PASSWORD_RESET),
    ).rejects.toThrow('Fail');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail },
      select: {
        id: true,
        email: true,
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  test('deve gerar erro se usuário não for encontrado.', async () => {
    const mockEmail = 'joao@example.com';

    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.resendCodeService(mockEmail, VerificationType.PASSWORD_RESET),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail },
      select: {
        id: true,
        email: true,
      },
    });
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso sendUserCode falhar.', async () => {
    const mockUser = {
      id: 'user123',
      email: 'joao@example.com',
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.resendCodeService(
        mockUser.email,
        VerificationType.PASSWORD_RESET,
      ),
    ).rejects.toThrow('Fail');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockUser.email },
      select: {
        id: true,
        email: true,
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

//Teste validação de código.
describe('authService - verifyUserCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve validar o código com sucesso.', async () => {
    const mockEmail = 'joao@example.com';
    const mockUser = { id: 'user123' };
    const mockCode = '123456';
    const mockCodeHash = crypto
      .createHash('sha256')
      .update(mockCode)
      .digest('hex');
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      attempts: 0,
      codeHash: mockCodeHash,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.findFirst.mockResolvedValue(mockRecord);

    prisma.verificationCode.updateMany.mockResolvedValue({ count: 1 });

    generateVerificationToken.mockReturnValue('token_fake');

    const result = await authService.verifyUserCode(
      mockEmail,
      mockCode,
      VerificationType.LOGIN,
    );

    expect(result).toEqual({
      verificationToken: 'token_fake',
      message: 'Código validado com sucesso.',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail },
      select: { id: true },
    });
    expect(prisma.verificationCode.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: mockUser.id }),
      }),
    );
    expect(prisma.verificationCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationType.LOGIN,
          used: false,
        }),
      }),
    );
    expect(prisma.verificationCode.update).not.toHaveBeenCalled();
    expect(prisma.verificationCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: mockRecord.id,
          used: false,
        }),
        data: {
          used: true,
        },
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Código validado com sucesso.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
  });
  test('deve gerar erro quando algum parâmetro não for informado.', async () => {
    const mockEmail = 'joao@example.com';

    await expect(authService.verifyUserCode(mockEmail)).rejects.toThrow(
      'Dados inválidos',
    );
  });
  test('deve gerar erro quando usuário não for encontrado.', async () => {
    const mockUser = {
      email: 'joao@example.com',
    };
    const mockCode = '123456';
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.verifyUserCode(
        mockUser.email,
        mockCode,
        VerificationType.LOGIN,
      ),
    ).rejects.toThrow('Usuário não encontrado.');
  });
  test('deve gerar erro quando código não for encontrado.', async () => {
    const mockEmail = 'joao@example.com';
    const mockUser = { id: 'user123' };
    const mockCode = '123456';

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.findFirst.mockResolvedValue(null);

    await expect(
      authService.verifyUserCode(mockEmail, mockCode, VerificationType.LOGIN),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail },
      select: { id: true },
    });
    expect(prisma.verificationCode.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
        }),
      }),
    );
    expect(prisma.verificationCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationType.LOGIN,
        }),
      }),
    );
    expect(prisma.verificationCode.update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Código inválido informado.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(prisma.verificationCode.updateMany).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro por excesso de tentativas.', async () => {
    const mockEmail = 'joao@example.com';
    const mockUser = { id: 'user123' };
    const mockCode = '123456';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      attempts: 5,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.findFirst.mockResolvedValue(mockRecord);

    prisma.verificationCode.update.mockResolvedValue({ used: true });

    await expect(
      authService.verifyUserCode(mockEmail, mockCode, VerificationType.LOGIN),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail },
      select: { id: true },
    });
    expect(prisma.verificationCode.deleteMany).toHaveBeenCalled();
    expect(prisma.verificationCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationType.LOGIN,
        }),
      }),
    );
    expect(prisma.verificationCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockRecord.id },
        data: { used: true },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Excesso de tentativas.',
      expect.objectContaining({ userId: mockUser.id }),
    );
    expect(prisma.verificationCode.updateMany).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro com código inválido digitado.', async () => {
    const mockEmail = 'joao@example.com';
    const mockUser = { id: 'user123' };
    const mockCode = '123456';
    const mockCodehash = crypto
      .createHash('sha256')
      .update(mockCode)
      .digest('hex');
    const mockCodeError = '999999';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      codeHash: mockCodehash,
      attempts: 0,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.findFirst.mockResolvedValue(mockRecord);

    prisma.verificationCode.update.mockResolvedValue({
      attempts: 1,
    });

    await expect(
      authService.verifyUserCode(
        mockEmail,
        mockCodeError,
        VerificationType.LOGIN,
      ),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.verificationCode.deleteMany).toHaveBeenCalled();
    expect(prisma.verificationCode.findFirst).toHaveBeenCalled();
    expect(prisma.verificationCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockRecord.id },
        data: { attempts: { increment: 1 } },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de código inválido.',
      expect.objectContaining({
        userId: mockUser.id,
        type: VerificationType.LOGIN,
      }),
    );
    expect(prisma.verificationCode.updateMany).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro com código inválido atingindo limite de tentativas.', async () => {
    const mockEmail = 'joao@example.com';
    const mockUser = { id: 'user123' };
    const mockCode = '123456';
    const mockCodeHash = crypto
      .createHash('sha256')
      .update(mockCode)
      .digest('hex');
    const mockCodeError = '222222';
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      codeHash: mockCodeHash,
      attempts: 4,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.findFirst.mockResolvedValue(mockRecord);

    prisma.verificationCode.update.mockResolvedValueOnce({ attempts: 5 });

    prisma.verificationCode.update.mockResolvedValueOnce({ used: true });

    await expect(
      authService.verifyUserCode(
        mockEmail,
        mockCodeError,
        VerificationType.LOGIN,
      ),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.verificationCode.deleteMany).toHaveBeenCalled();
    expect(prisma.verificationCode.findFirst).toHaveBeenCalled();
    expect(prisma.verificationCode.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: mockRecord.id },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      }),
    );
    expect(prisma.verificationCode.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: mockRecord.id },
        data: { used: true },
      }),
    );
    expect(prisma.verificationCode.updateMany).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de código inválido.',
      expect.objectContaining({
        userId: mockUser.id,
        type: VerificationType.LOGIN,
      }),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro se o código já foi utilizado.', async () => {
    const mockUser = { id: 'user123' };
    const mockEmail = 'joao@example.com';
    const mockCode = '123456';
    const mockCodeHash = crypto
      .createHash('sha256')
      .update(mockCode)
      .digest('hex');
    const mockRecord = {
      id: 'code_id',
      userId: mockUser.id,
      codeHash: mockCodeHash,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.findFirst.mockResolvedValue(mockRecord);

    prisma.verificationCode.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      authService.verifyUserCode(mockEmail, mockCode, VerificationType.LOGIN),
    ).rejects.toThrow('Código inválido ou expirado.');

    expect(prisma.verificationCode.deleteMany).toHaveBeenCalled();
    expect(prisma.verificationCode.findFirst).toHaveBeenCalled();
    expect(prisma.verificationCode.update).not.toHaveBeenCalled();
    expect(prisma.verificationCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: mockRecord.id,
          used: false,
        }),
        data: { used: true },
      }),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      'Código já utilizado.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});

//teste validação de token.
describe('authService - verifyVerificationToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve verificar o token com sucesso.', async () => {
    const mockToken = 'token_fake';
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';
    const mockDecoded = {
      userId: 'user123',
      type: VerificationType.LOGIN,
    };

    jwt.verify.mockReturnValue({
      userId: mockDecoded.userId,
      type: mockDecoded.type,
    });

    const result = await authService.verifyVerificationToken(mockToken);

    expect(result).toEqual(mockDecoded);
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
  });
  test('deve gerar erro se não receber o token.', async () => {
    await expect(
      authService.verifyVerificationToken(undefined),
    ).rejects.toThrow('Token não informado.');

    expect(jwt.verify).not.toHaveBeenCalled();
  });
  test('deve gerar erro se verificação do token falhar.', async () => {
    const mockToken = 'token_fake';
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';

    jwt.verify.mockImplementation(() => {
      throw new Error('Fail');
    });

    await expect(
      authService.verifyVerificationToken(mockToken),
    ).rejects.toThrow('Token inválido ou expirado.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Falha na verificação do token.',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
  });
});

//Teste que cria um usuário.
describe('authService - createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve criar e retornar um novo usuário com sucesso', async () => {
    const userData = {
      name: 'João',
      email: 'JOAO@EXAMPLE.COM ',
      passwordHash: 'sennsibbbsbhbsgvg987',
      role: 'Candidato',
      cpf: '12345678900',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockSavedUser = {
      ...userData,
      id: 'fake_id',
      email: 'joao@example.com',
      role: 'CANDIDATO',
      cnpj: undefined,
    };

    prisma.user.create.mockResolvedValue(mockSavedUser);

    const result = await authService.createUser(userData);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'João',
        email: 'joao@example.com',
        passwordHash: 'sennsibbbsbhbsgvg987',
        role: 'CANDIDATO',
        cpf: '12345678900',
        cnpj: undefined,
        termsAccepted: true,
        birthDate: userData.birthDate,
      },
    });
    expect(result).toEqual(mockSavedUser);
  });
  test('deve gerar erro com role for inválido', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'bsibdbs333',
      role: 'Recrutador ',
      cnpj: '12345678900987',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    await expect(authService.createUser(userData)).rejects.toThrow(
      'Tipo de usuário inválido.',
    );

    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

//Teste registrar usuário.
describe('authService - registerUserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve criar usuário e enviar código de verificação', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'sennsibbbsbhbsgvg987',
      role: 'CANDIDATO',
      cpf: '12345678900',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockUser = {
      ...userData,
      id: 'fake_id',
      birthDate: userData.birthDate,
    };

    prisma.user.create.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockResolvedValue(0);

    prisma.$transaction.mockResolvedValue([]);

    sendEmail.mockResolvedValue();

    const result = await authService.registerUserService(userData);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'joao@example.com',
        role: 'CANDIDATO',
      }),
    });
    expect(sendEmail).toHaveBeenCalledWith(
      mockUser.email,
      'Seu código de verificação',
      expect.stringContaining('Seu código de verificação'),
      expect.any(String),
    );
    expect(result).toEqual({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });
  });
  test('deve gerar erro ao criar usuário.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'bdbsbbn748',
      role: 'CANDIDATO',
      cpf: '12345698742',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    prisma.user.create.mockRejectedValue(new Error('DB error'));

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'DB error',
    );
    expect(prisma.user.create).toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
  test('deve gerar erro no limite de envio de código.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'nhsbb233',
      role: 'RECRUTADOR',
      cnpj: '12345678900987',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockUser = {
      ...userData,
      id: 'fake_id',
      birthDate: userData.birthDate,
    };

    prisma.user.create.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockResolvedValue(5);

    await expect(authService.registerUserService(userData)).rejects.toThrow();

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'João',
        cnpj: '12345678900987',
      }),
    });
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
  test('deve gerar erro no envio de e-mail.', async () => {
    const userData = {
      name: 'João',
      email: 'joao@example.com',
      passwordHash: 'duhduwbuwb244',
      role: 'RECRUTADOR',
      cnpj: '12345678900987',
      termsAccepted: true,
      birthDate: new Date('2000-01-01'),
    };

    const mockUser = {
      ...userData,
      id: 'fake_id',
      birthDate: userData.birthDate,
    };

    prisma.user.create.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockResolvedValue(0);

    prisma.$transaction.mockResolvedValue([]);

    sendEmail.mockRejectedValue(new Error('Fail'));

    await expect(authService.registerUserService(userData)).rejects.toThrow(
      'Erro interno ao enviar e-mail de verificação.',
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar e-mail de verificação.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'João',
        email: 'joao@example.com',
      }),
    });
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      'joao@example.com',
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });
});

//Teste de validação de e-mail.
describe('authService - verifyEmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve validar e-mail do usuário com sucesso e gerar login.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
    };
    const mockDecoded = {
      userId: 'user123',
      type: 'EMAIL_VERIFICATION',
    };
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.update.mockResolvedValue({
      id: mockUser.id,
      name: mockUser.name,
      role: mockUser.role,
      email: mockUser.email,
    });

    generateAccessToken.mockReturnValue(mockAccessToken);

    generateRefreshToken.mockReturnValue(mockRefreshToken);

    prisma.refreshToken.create.mockResolvedValue();

    sendWelcomeEmail.mockResolvedValue();

    const result = await authService.verifyEmailService(mockVerificationToken);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockVerificationToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: mockDecoded.userId,
        }),
        data: { emailVerified: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }),
    );
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      role: mockUser.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(sendWelcomeEmail).toHaveBeenCalledWith('João', 'joao@example.com');
    expect(result).toEqual({
      message: 'E-mail verificado e login realizado com sucesso.',
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: mockUser,
    });
  });
  test('deve gerar erro se não receber token.', async () => {
    await expect(authService.verifyEmailService(undefined)).rejects.toThrow(
      'Token não informado.',
    );

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });
  test('deve gerar erro se tipo de verificação for inválido.', async () => {
    const mockVerificationToken = 'token_fake';
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';
    const mockDecoded = {
      userId: 'user123',
      type: undefined,
    };
    jwt.verify.mockReturnValue(mockDecoded);

    await expect(
      authService.verifyEmailService(mockVerificationToken),
    ).rejects.toThrow('Tipo de verificação inválido.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockVerificationToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });
  test('deve retornar erro ao atualizar verificação de e-mail no DB.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'EMAIL_VERIFICATION',
    };
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.update.mockRejectedValue(new Error('DB error'));

    await expect(
      authService.verifyEmailService(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao concluir verificação do e-mail.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockVerificationToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDecoded.userId },
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao verificar e-mail e fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
      }),
    );
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso storeRefreshToken falhar.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'EMAIL_VERIFICATION',
    };
    const mockUser = {
      id: 'user123',
      role: 'CANDIDATO',
      name: 'João',
      email: 'joao@example.com',
    };
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.update.mockResolvedValue(mockUser);

    generateAccessToken.mockReturnValue(mockAccessToken);

    generateRefreshToken.mockReturnValue(mockRefreshToken);

    prisma.refreshToken.create.mockRejectedValue(
      new Error('Erro ao armazenar refresh token.'),
    );

    await expect(
      authService.verifyEmailService(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao concluir verificação do e-mail.');

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDecoded.userId },
        data: { emailVerified: true },
        select: {
          email: true,
          id: true,
          name: true,
          role: true,
        },
      }),
    );
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      role: mockUser.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao verificar e-mail e fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
      }),
    );
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });
  test('deve continuar fluxo mesmo com erro ao enviar e-mail', async () => {
    const mockVerificationToken = 'token_fake';
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
    };
    const mockDecoded = {
      userId: 'user123',
      type: 'EMAIL_VERIFICATION',
    };
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.update.mockResolvedValue({
      id: mockUser.id,
      name: mockUser.name,
      role: mockUser.role,
      email: mockUser.email,
    });

    generateAccessToken.mockReturnValue(mockAccessToken);

    generateRefreshToken.mockReturnValue(mockRefreshToken);

    prisma.refreshToken.create.mockResolvedValue();

    sendWelcomeEmail.mockRejectedValue(new Error('Fail'));

    const result = await authService.verifyEmailService(mockVerificationToken);

    expect(jwt.verify).toHaveBeenCalledWith(
      mockVerificationToken,
      process.env.VERIFICATION_TOKEN_SECRET,
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: mockDecoded.userId,
        }),
        data: { emailVerified: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }),
    );
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      role: mockUser.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(sendWelcomeEmail).toHaveBeenCalledWith('João', 'joao@example.com');
    expect(logger.error).toHaveBeenCalledWith(
      'Falha ao enviar e-mail de boas-vindas:',
      expect.objectContaining({
        error: 'Fail',
      }),
    );
    expect(result).toEqual({
      message: 'E-mail verificado e login realizado com sucesso.',
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: mockUser,
    });
  });
});

//Teste de autenticação do usuário.
describe('authService - startLogin', () => {
  const mockEmail = 'joao@example.com';
  const mockPassword = 'senha123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o usuário e código se as credenciais forem válidas.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashfake123',
      emailVerified: true,
      role: 'CANDIDATO',
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    prisma.verificationCode.count.mockResolvedValue(1);

    prisma.$transaction.mockResolvedValue();

    sendEmail.mockResolvedValue();

    prisma.user.update.mockResolvedValue({});

    const result = await authService.startLogin(mockEmail, mockPassword);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: mockEmail.toLowerCase().trim(),
        }),
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: {
          loginAttempts: 0,
          isBlocked: false,
          blockExpires: null,
        },
      }),
    );
    expect(result).toEqual({
      message: 'Código enviado com sucesso, verifique seu e-mail.',
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Código enviado com sucesso.',
      expect.objectContaining({
        userId: 'user123',
      }),
    );
  });
  test('deve gerar erro quando algum parâmetro não for informado.', async () => {
    const mockEmail = 'joao@example.com';

    await expect(authService.startLogin(mockEmail)).rejects.toThrow(
      'Dados inválidos',
    );
  });
  test('deve retornar erro se e-mail não existir.', async () => {
    const fake_hash =
      '$2b$10$Wyxrd9PPA0qYX4jkcrG7w.VWhf4HWbvYCGFyjcHYGESuaqDiPHqE.';
    prisma.user.findUnique.mockResolvedValue(null);

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Credenciais inválidas.');

    expect(bcrypt.compare).toHaveBeenCalledWith(mockPassword, fake_hash);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de login com email inexistente.',
      expect.objectContaining({
        email: mockEmail.toLowerCase().trim(),
      }),
    );
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve liberar acesso se o tempo de bloqueio estiver expirado.', async () => {
    const mockNow = new Date();
    const mockDateExpired = new Date(mockNow.getTime() - 24 * 60 * 60 * 1000);
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
      passwordHash: 'hash_fake',
      emailVerified: true,
      isBlocked: true,
      loginAttempts: 0,
      blockExpires: mockDateExpired,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.user.update
      .mockResolvedValueOnce({
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
      })
      .mockResolvedValueOnce({
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
      });

    bcrypt.compare.mockResolvedValue(true);

    prisma.verificationCode.count.mockResolvedValue(1);

    prisma.$transaction.mockResolvedValue();

    sendEmail.mockResolvedValue();

    const result = await authService.startLogin(mockEmail, mockPassword);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockEmail.toLowerCase().trim() },
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledTimes(2);
    expect(prisma.user.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: mockUser.id },
        data: {
          isBlocked: false,
          loginAttempts: 0,
          blockExpires: null,
        },
      }),
    );
    expect(prisma.user.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: mockUser.id },
        data: {
          loginAttempts: 0,
          isBlocked: false,
          blockExpires: null,
        },
      }),
    );
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Código enviado com sucesso.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(result).toEqual({
      message: 'Código enviado com sucesso, verifique seu e-mail.',
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
    });
  });
  test('deve retornar erro em tentativa de login em conta bloqueada.', async () => {
    const now = new Date();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const mockBlockExpires = new Date(now.getTime() + FIFTEEN_MINUTES);
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      role: 'CANDIDATO',
      emailVerified: true,
      isBlocked: true,
      loginAttempts: 5,
      blockExpires: mockBlockExpires,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow(
      'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockEmail.toLowerCase().trim() },
      }),
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Tentativa de login em conta bloqueada.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro se email não estiver verificado.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      role: 'CANDIDATO',
      emailVerified: false,
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Credenciais inválidas.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockEmail.toLowerCase().trim() },
      }),
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve retornar erro se a senha estiver incorreta.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      emailVerified: true,
      role: 'CANDIDATO',
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(false);

    prisma.user.update.mockResolvedValue({
      loginAttempts: 1,
    });

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Credenciais inválidas.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockEmail.toLowerCase().trim() },
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Senha inválida.',
      expect.objectContaining({ userId: mockUser.id, email: mockUser.email }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: { loginAttempts: { increment: 1 } },
      }),
    );
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve bloquear usuário por excesso de tentativas.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashedPassword',
      role: 'RECRUTADOR',
      emailVerified: true,
      isBlocked: false,
      loginAttempts: 4,
      blockExpires: null,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(false);

    prisma.user.update
      .mockResolvedValueOnce({ loginAttempts: 5 })
      .mockResolvedValueOnce({ isBlocked: true });

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow(
      'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockEmail.toLowerCase().trim() },
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Senha inválida.',
      expect.objectContaining({ userId: mockUser.id, email: mockUser.email }),
    );
    expect(prisma.user.update).toHaveBeenCalledTimes(2);
    expect(prisma.user.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: mockUser.id },
        data: {
          loginAttempts: { increment: 1 },
        },
      }),
    );
    expect(prisma.user.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          isBlocked: true,
          blockExpires: expect.any(Date),
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Usuário bloqueado por excesso de tentativas.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve gerar erro se o envio do código falhar.', async () => {
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: mockEmail,
      passwordHash: 'hashfake123',
      emailVerified: true,
      role: 'CANDIDATO',
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    prisma.verificationCode.count.mockResolvedValue(1);

    prisma.$transaction.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.startLogin(mockEmail, mockPassword),
    ).rejects.toThrow('Erro interno ao tentar enviar código, tente novamente.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: mockEmail.toLowerCase().trim(),
        }),
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockUser.passwordHash,
    );
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
describe('authService - finalizeLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve finaliar o login com sucesso', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'LOGIN',
    };
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.findUnique.mockResolvedValue(mockUser);

    generateAccessToken.mockReturnValue(mockAccessToken);

    generateRefreshToken.mockReturnValue(mockRefreshToken);

    prisma.refreshToken.create.mockResolvedValue();

    prisma.user.update.mockResolvedValue();

    const result = await authService.finalizeLogin(mockVerificationToken);

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      role: mockUser.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(result).toEqual({
      message: 'Login realizado com sucesso.',
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: mockUser,
    });
  });
  test('deve gerar erro com token ausente.', async () => {
    const mockVerificationToken = undefined;

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Token não informado.');

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  test('deve gerar erro com tipo de vericação inválido.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'RESET_PASSWORD',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Tipo de verificação inválido.');

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  test('deve gerar erro se a consulta no DB falhar.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'LOGIN',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao tentar fazer login.');

    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao tentar fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Fail',
      }),
    );
    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDecoded.userId },
      }),
    );
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  test('deve gerar erro com usuário não encontrado.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'LOGIN',
    };
    const mockUser = undefined;

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDecoded.userId },
      }),
    );
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao tentar fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Usuário não encontrado.',
      }),
    );
  });
  test('deve gerar erro se storeRefreshToken falhar.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'LOGIN',
    };
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';
    const mockUser = {
      id: 'user123',
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.findUnique.mockResolvedValue(mockUser);

    generateAccessToken.mockReturnValue(mockAccessToken);

    generateRefreshToken.mockReturnValue(mockRefreshToken);

    prisma.refreshToken.create.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.finalizeLogin(mockVerificationToken),
    ).rejects.toThrow('Erro interno ao armazenar refresh token.');

    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao tentar fazer login.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Erro interno ao armazenar refresh token.',
      }),
    );
    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockUser.id,
      role: mockUser.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

//Teste de logout.
describe('authService - logoutUserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve revogar o token com sucesso.', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'fake-secret';
    const mockAccessToken = 'accessTokenFake';
    const mockRefreshToken = 'refreshTokenFake';
    const mockAccessTokenHash = crypto
      .createHash('sha256')
      .update(mockAccessToken)
      .digest('hex');
    const mockRefreshTokenHash = crypto
      .createHash('sha256')
      .update(mockRefreshToken)
      .digest('hex');

    jwt.verify.mockReturnValue({
      id: 'user123',
      role: 'CANDIDATO',
      exp: 1710000900,
    });

    prisma.revokedToken.create.mockResolvedValue();

    prisma.refreshToken.deleteMany.mockResolvedValue();

    const result = await authService.logoutUserService(
      mockAccessToken,
      mockRefreshToken,
    );

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: mockAccessTokenHash,
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: mockRefreshTokenHash },
      }),
    );
    expect(result).toEqual({ message: 'Logout realizado com sucesso.' });
    expect(logger.info).toHaveBeenCalledWith(
      'Logout realizado com sucesso.',
      expect.objectContaining({ userId: 'user123' }),
    );
  });
  test('deve lançar erro se token não for fornecido', async () => {
    const mockAccessToken = null;
    const mockRefreshToken = 'refresh_fake';
    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Token não informado.');

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(prisma.revokedToken.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('deve lançar erro ao decodificar token.', async () => {
    const mockAccessToken = 'access_fake';
    const mockRefreshToken = 'refresh_fake';
    process.env.ACCESS_TOKEN_SECRET = 'fake-secret';

    jwt.verify.mockImplementation(() => {
      throw new Error('Token inválido.');
    });

    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Token inválido ou expirado.');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
  test('não lançar erro se o token já estiver na black list.', async () => {
    const mockAccessToken = 'access_fake';
    const mockRefreshToken = 'refresh_fake';
    process.env.ACCESS_TOKEN_SECRET = 'fake_secret';
    const mockErrorP2002 = new Prisma.PrismaClientKnownRequestError(
      'Token já encontra-se na black list.',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
      },
    );

    jwt.verify.mockReturnValue({
      id: 'user123',
      role: 'RECRUTADOR',
      exp: 1710000900,
    });

    prisma.revokedToken.create.mockRejectedValue(mockErrorP2002);

    prisma.refreshToken.deleteMany.mockResolvedValue();

    const result = await authService.logoutUserService(
      mockAccessToken,
      mockRefreshToken,
    );

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.create).toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Token já está na blacklist.');
    expect(result).toEqual({ message: 'Logout realizado com sucesso.' });
    expect(logger.info).toHaveBeenCalledWith(
      'Logout realizado com sucesso.',
      expect.objectContaining({ userId: 'user123' }),
    );
  });
  test('deve lançar erro ao falhar ao salvar token revogado.', async () => {
    const mockAccessToken = 'access_fake';
    const mockRefreshToken = 'refresh_fake';
    process.env.ACCESS_TOKEN_SECRET = 'secret_fake';

    jwt.verify.mockReturnValue({
      id: 'user123',
      role: 'RECRUTADOR',
      exp: 1710000900,
    });

    prisma.revokedToken.create.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.logoutUserService(mockAccessToken, mockRefreshToken),
    ).rejects.toThrow('Fail');

    expect(jwt.verify).toHaveBeenCalledWith(
      mockAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    expect(prisma.revokedToken.create).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});

//Teste para verificar se o token foi salvo.
describe('authService - storeRefreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve armazenar o refresh token com os dados corretos', async () => {
    const mockToken = 'refresh_token_123';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockUserId = 'user123';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    prisma.refreshToken.create.mockResolvedValue({
      userId: mockUserId,
      tokenHash: mockTokenHash,
      expiresAt: mockExpiresAt,
    });

    await authService.storeRefreshToken({
      userId: mockUserId,
      token: mockToken,
      expiresAt: mockExpiresAt,
    });

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: mockUserId,
          tokenHash: mockTokenHash,
          expiresAt: mockExpiresAt,
        },
      }),
    );
  });
  test('deve gerar erro caso userId não seja informado.', async () => {
    const mockUserId = null;
    const mockToken = 'refresh_token_123';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await expect(
      authService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Dados inválidos.');
    expect(logger.warn).toHaveBeenCalledWith(
      'Dados inválidos ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
      }),
    );
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso token não seja informado.', async () => {
    const mockUserId = 'user123';
    const mockToken = null;
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await expect(
      authService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Dados inválidos.');
    expect(logger.warn).toHaveBeenCalledWith(
      'Dados inválidos ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
      }),
    );
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso expiresAt não seja informado.', async () => {
    const mockUserId = 'user123';
    const mockToken = 'refresh_token_123';
    const mockExpiresAt = null;

    await expect(
      authService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Dados inválidos.');
    expect(logger.warn).toHaveBeenCalledWith(
      'Dados inválidos ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
      }),
    );
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso expiresAt não for uma data valida.', async () => {
    const mockUserId = 'user123';
    const mockToken = 'refresh_token_123';
    const mockExpiresAt = new Date('abc');

    await expect(
      authService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Dados inválidos.');
    expect(logger.warn).toHaveBeenCalledWith(
      'Dados inválidos ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
      }),
    );
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro se falhar ao salvar o refresh token', async () => {
    const mockToken = 'refresh_token_123';
    const mockUserId = 'user123';
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    prisma.refreshToken.create.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.storeRefreshToken({
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      }),
    ).rejects.toThrow('Erro interno ao armazenar refresh token.');
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao armazenar refresh token.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Fail',
      }),
    );
  });
});

//Teste para verificar se o token é válido.
describe('authService - verifyRefreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o payload decodificado se o token for válido', async () => {
    const mockToken = 'refresh_token_123';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    process.env.REFRESH_TOKEN_SECRET = 'refresh_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue({
      tokenHash: mockTokenHash,
      expiresAt: mockExpiresAt,
    });

    const result = await authService.verifyRefreshToken(mockToken);

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(result).toEqual(mockDecoded);
  });
  test('deve gerar erro caso o token não for informado.', async () => {
    const mockToken = null;

    await expect(authService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token não informado.',
    );

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro se jwt.verify falhar.', async () => {
    const mockToken = 'token_corrompido';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');

    jwt.verify.mockImplementation(() => {
      throw new Error('Falha ao decodificar token.');
    });

    await expect(authService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(logger.warn).toHaveBeenCalledWith(
      'Falha na verificação do refresh token.',
      expect.objectContaining({
        tokenHash: mockTokenHash,
        error: 'Falha ao decodificar token.',
      }),
    );
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro se o token não for encontrado no DB.', async () => {
    const mockToken = 'token_inexistente';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    process.env.REFRESH_TOKEN_SECRET = 'refresh_fake';
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(authService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Token de atualização inválido ou expirado.',
      expect.objectContaining({
        userId: mockDecoded.id,
        tokenHash: mockTokenHash,
      }),
    );
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
  });
  test('deve gerar erro se o token estiver expirado.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockDecoded = {
      id: 'user123',
      role: 'RECRUTADOR',
    };
    const mockExpiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    process.env.REFRESH_TOKEN_SECRET = 'refresh_fake';

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue({
      expiresAt: mockExpiresAt,
    });

    await expect(authService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Token de atualização inválido ou expirado.',
      expect.objectContaining({
        userId: mockDecoded.id,
        tokenHash: mockTokenHash,
      }),
    );
  });
  test('deve gerar erro se a consulta no DB falhar.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockDecoded = {
      id: 'user123',
      role: 'RECRUTADOR',
    };
    process.env.REFRESH_TOKEN_SECRET = 'refresh_fake';

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(authService.verifyRefreshToken(mockToken)).rejects.toThrow(
      'Fail',
    );

    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

//Teste para gerar novo Access e refresh Token.
describe('authService - refreshTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve gerar novo Access e refresh Token com sucesso.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockDecoded = {
      id: 'user123',
      role: 'RECRUTADOR',
    };
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue({
      expiresAt: mockExpiresAt,
    });

    prisma.refreshToken.deleteMany.mockResolvedValue();

    prisma.user.findUnique.mockReturnValue({
      id: mockDecoded.id,
      role: mockDecoded.role,
      isBlocked: false,
    });

    generateAccessToken.mockReturnValue('accessToken_fake');

    generateRefreshToken.mockReturnValue('refreshToken_fake');

    prisma.refreshToken.create.mockResolvedValue({});

    const result = await authService.refreshTokenService(mockToken);

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: expect.objectContaining({
        id: true,
        role: true,
        isBlocked: true,
      }),
    });
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockDecoded.id,
      role: mockDecoded.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockDecoded.id,
    });
    expect(result).toEqual({
      accessToken: 'accessToken_fake',
      refreshToken: 'refreshToken_fake',
    });
  });
  test('deve gerar erro se verifyRefreshToken falhar.', async () => {
    const mockToken = 'token_fake';

    jwt.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Token de atualização inválido ou expirado.',
    );

    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso usuário não seja encontrado.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockDecoded = {
      id: 'user123',
      role: 'RECRUTADOR',
    };
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue({
      expiresAt: mockExpiresAt,
    });

    prisma.refreshToken.deleteMany.mockResolvedValue({});

    prisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Usuário não encontrado.',
    );

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.refreshToken.findUnique).toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: {
        id: true,
        role: true,
        isBlocked: true,
      },
    });
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso usuário esteja bloqueado.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockDecoded = {
      id: 'user123',
      role: 'RECRUTADOR',
    };
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue({
      expiresAt: mockExpiresAt,
    });

    prisma.refreshToken.deleteMany.mockResolvedValue({});

    prisma.user.findUnique.mockResolvedValue({
      id: mockDecoded.id,
      role: mockDecoded.role,
      isBlocked: true,
    });

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Usuário bloqueado.',
    );

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.refreshToken.findUnique).toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: {
        id: true,
        role: true,
        isBlocked: true,
      },
    });
    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  test('deve gerar erro se storeRefreshToken falhar.', async () => {
    const mockToken = 'token_fake';
    const mockTokenHash = crypto
      .createHash('sha256')
      .update(mockToken)
      .digest('hex');
    const mockDecoded = {
      id: 'user123',
      role: 'CANDIDATO',
    };
    const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.refreshToken.findUnique.mockResolvedValue({
      expiresAt: mockExpiresAt,
    });

    prisma.refreshToken.deleteMany.mockResolvedValue({});

    prisma.user.findUnique.mockResolvedValue({
      id: 'user123',
      role: 'CANDIDATO',
      isBlocked: false,
    });

    generateAccessToken.mockReturnValue('accessToken_fake');

    generateRefreshToken.mockReturnValue('refreshToken_fake');

    prisma.refreshToken.create.mockRejectedValue(new Error('Fail'));

    await expect(authService.refreshTokenService(mockToken)).rejects.toThrow(
      'Erro interno ao armazenar refresh token.',
    );

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.refreshToken.findUnique).toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockDecoded.id },
      select: {
        id: true,
        role: true,
        isBlocked: true,
      },
    });
    expect(generateAccessToken).toHaveBeenCalledWith({
      id: mockDecoded.id,
      role: mockDecoded.role,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      id: mockDecoded.id,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });
});

//Teste de envio de E-mail para redefinir a senha.
describe('authService - forgotPasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve enviar o e-mail de recuperação se o usuário for encontrado.', async () => {
    const mockEmail = ' teste@examplE.com';
    const mockNormalizedEmail = 'teste@example.com';
    const mockUser = {
      id: 'user123',
      email: mockNormalizedEmail,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockResolvedValue(1);

    prisma.verificationCode.deleteMany.mockResolvedValue();

    prisma.verificationCode.create.mockResolvedValue();

    sendEmail.mockResolvedValue();

    prisma.$transaction.mockResolvedValue();

    const result = await authService.forgotPasswordService(mockEmail);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockNormalizedEmail },
      select: { id: true, email: true },
    });
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(prisma.verificationCode.deleteMany).toHaveBeenCalled();
    expect(prisma.verificationCode.create).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Se o e-mail existir, um código foi enviado.',
    });
  });
  test('deve gerar erro se email for null.', async () => {
    const mockEmail = null;

    await expect(authService.forgotPasswordService(mockEmail)).rejects.toThrow(
      'Dado inválido.',
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
  });
  test('deve retornar mensagem genérica se o e-mail não existir.', async () => {
    const mockEmail = 'naoencontrado@example.com';

    prisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.forgotPasswordService(mockEmail);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail.toLowerCase().trim() },
      select: { id: true, email: true },
    });
    expect(prisma.verificationCode.count).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Se o e-mail existir, um código foi enviado.',
    });
  });
  test('deve gerar erro caso sendUserCode falhar.', async () => {
    const mockEmail = 'teste@example.com';
    const mockUser = {
      id: 'user123',
      email: mockEmail,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.verificationCode.count.mockResolvedValue(1);

    prisma.$transaction.mockResolvedValue([]);

    sendEmail.mockRejectedValue(new Error('Fail'));

    await expect(authService.forgotPasswordService(mockEmail)).rejects.toThrow(
      'Erro interno ao enviar código de verificação.',
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail.toLowerCase().trim() },
      select: { id: true, email: true },
    });
    expect(prisma.verificationCode.count).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao enviar código de verificação.',
      expect.objectContaining({
        userId: mockUser.id,
      }),
    );
  });
});

//Teste para redefinir a senha.
describe('authService - resetPasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve redefinir a senha com sucesso se o token for válido e o usuário existir', async () => {
    const mockVerificationToken = 'token_valido';
    const mockNewPasswordhash = 'hash_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'PASSWORD_RESET',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.update.mockResolvedValue();

    prisma.refreshToken.deleteMany.mockResolvedValue();

    const result = await authService.resetPasswordService(
      mockVerificationToken,
      mockNewPasswordhash,
    );

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockDecoded.userId },
      data: { passwordHash: mockNewPasswordhash },
    });
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: mockDecoded.userId },
    });
    expect(result).toEqual({ message: 'Senha redefinida com sucesso.' });
  });
  test('deve gerar erro se o token estiver ausente.', async () => {
    const mockVerificationToken = undefined;
    const mockNewPasswordhash = 'hash_fake';

    await expect(
      authService.resetPasswordService(
        mockVerificationToken,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Dados inválidos.');

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });
  test('deve gerar erro se verifyVerificationToken falhar.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockNewPasswordhash = 'hash_fake';

    jwt.verify.mockImplementation(() => {
      throw new Error('Token inválido ou expirado.');
    });

    await expect(
      authService.resetPasswordService(
        mockVerificationToken,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Token inválido ou expirado.');

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a chamada ao DB falhe.', async () => {
    const mockVerificationToken = 'token_fake';
    const mockNewPasswordhash = 'hash_fake';
    const mockDecoded = {
      userId: 'user123',
      type: 'PASSWORD_RESET',
    };

    jwt.verify.mockReturnValue(mockDecoded);

    prisma.user.update.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.resetPasswordService(
        mockVerificationToken,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Falha interna ao redefinir senha.');

    expect(jwt.verify).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDecoded.userId },
      }),
    );
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao redefinir senha.',
      expect.objectContaining({
        userId: mockDecoded.userId,
        error: 'Fail',
      }),
    );
  });
});

//Teste que altera a senha.
describe('authService - changePasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve alterar a senha com sucesso quando as credenciais são válidas', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPasswordhash = 'new_hash_fake';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(true);

    prisma.user.update.mockResolvedValue();

    prisma.refreshToken.deleteMany.mockResolvedValue();

    const result = await authService.changePasswordService(
      mockUserId,
      mockCurrentPassword,
      mockNewPasswordhash,
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { passwordHash: true },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUserId },
      }),
    );
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
    });
    expect(result).toEqual({ message: 'Senha alterada com sucesso.' });
  });
  test('deve gerar erro caso alguma credencial seja inválida.', async () => {
    const mockUserId = null;
    const mockCurrentPassword = 'senhaAtual123';
    const mockNewPasswordhash = 'new_Hash_fake';

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Dados inválidos.');

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso a chamada ao DB falhe.', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPasswordhash = 'new_hash_fake';

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Falha interna ao alterar senha.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { passwordHash: true },
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Fail',
      }),
    );
  });
  test('deve gerar erro se o usuário não for encontrado.', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPasswordhash = 'new_hash_fake';
    const mockUser = undefined;

    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Usuário não encontrado.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { passwordHash: true },
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Usuário não encontrado.',
      }),
    );
  });
  test('deve lançar um erro se bcrypt.compare falhar', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'senhaCorreta123';
    const mockNewPasswordhash = 'new_hash_fake';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockRejectedValue(new Error('Erro interno do bcrypt'));

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Falha interna ao alterar senha.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { passwordHash: true },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Erro interno do bcrypt',
      }),
    );
  });
  test('deve lançar um erro se a senha atual estiver incorreta', async () => {
    const mockUserId = 'user123';
    const mockCurrentPassword = 'password_fake';
    const mockNewPasswordhash = 'new_hash_fake';

    const mockUser = {
      passwordHash: 'hash_fake',
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.changePasswordService(
        mockUserId,
        mockCurrentPassword,
        mockNewPasswordhash,
      ),
    ).rejects.toThrow('Senha atual incorreta.');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { passwordHash: true },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockUser.passwordHash,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao alterar senha.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Senha atual incorreta.',
      }),
    );
  });
});

//Teste que verifica se usuário cadastrou com CPF ou CNPJ.
describe('authService - getuserDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar cpf para usuário candidato', () => {
    const mockUser = { role: 'CANDIDATO', cpf: '12345678900' };
    expect(authService.getUserDocument(mockUser)).toEqual({
      cpf: mockUser.cpf,
    });
  });
  test('deve retornar cpf para usuário recrutador', () => {
    const mockUser = {
      role: 'RECRUTADOR',
      cpf: '12345678900',
    };
    expect(authService.getUserDocument(mockUser)).toEqual({
      cpf: mockUser.cpf,
    });
  });
  test('deve retornar cnpj para usuário recrutador', () => {
    const mockUser = { role: 'RECRUTADOR', cnpj: '12345678000199' };
    expect(authService.getUserDocument(mockUser)).toEqual({
      cnpj: mockUser.cnpj,
    });
  });
});

//Teste que visualiza o perfil do usuário.
describe('authService - getUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar o perfil do usuário corretamente quando usuário existe', async () => {
    const mockUserId = 'user123';
    const mockUser = {
      id: mockUserId,
      name: 'João',
      email: 'joao@example.com',
      role: 'CANDIDATO',
      birthDate: new Date('2000-01-01'),
      cpf: '090.118.076-93',
      cnpj: null,
    };
    const mockDocument = mockUser.cpf;

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await authService.getUserProfile(mockUserId);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        birthDate: true,
        cpf: true,
        cnpj: true,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        age: expect.any(Number),
        cpf: mockDocument,
      }),
    );
  });
  test('deve gerar erro se a credencial for inválida.', async () => {
    const mockUserId = null;

    await expect(authService.getUserProfile(mockUserId)).rejects.toThrow(
      'Dados inválidos.',
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  test('deve gerar erro caso chamada ao DB falhar.', async () => {
    const mockUserId = 'user123';

    prisma.user.findUnique.mockRejectedValue(new Error('Fail'));

    await expect(authService.getUserProfile(mockUserId)).rejects.toThrow(
      'Erro interno ao buscar perfil.',
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        birthDate: true,
        cpf: true,
        cnpj: true,
      },
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao buscar perfil do usuário.',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Fail',
      }),
    );
  });
  test('deve lançar erro se o usuário não for encontrado', async () => {
    const mockUserId = 'user123';
    const mockUser = undefined;

    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(authService.getUserProfile(mockUserId)).rejects.toThrow(
      'Usuário não encontrado.',
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        birthDate: true,
        cpf: true,
        cnpj: true,
      },
    });
  });
});
