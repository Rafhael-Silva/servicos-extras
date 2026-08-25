const { AccountType } = require('@prisma/client');
const { validateSchema } = require('../../../src/middlewares');

describe('middlewares - validateSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve validar com sucesso.', () => {
    const validatedData = {
      id: 'user123',
      name: 'João',
      accountType: AccountType.PERSON,
    };
    const mockSchema = {
      validate: jest.fn().mockReturnValue({
        error: undefined,
        value: validatedData,
      }),
    };
    const mockReq = {
      body: {
        id: 'user123',
        name: 'João',
        accountType: AccountType.PERSON,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    const middleware = validateSchema(mockSchema);

    middleware(mockReq, mockRes, mockNext);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockReq.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    expect(mockReq.body).toEqual(validatedData);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
  test('deve retornar erro de validação.', () => {
    const mockSchema = {
      validate: jest.fn().mockReturnValue({
        error: {
          details: [
            { message: 'O campo da senha atual é obrigatório.' },
            { message: 'O campo da nova senha é obrigatória.' },
            { message: 'O campo de confirmação da nova senha é obrigatório.' },
          ],
        },
        value: undefined,
      }),
    };

    const mockReq = {
      body: {
        currentPassword: '123',
        newPassword: undefined,
        confirmPassword: undefined,
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    const middleware = validateSchema(mockSchema);

    middleware(mockReq, mockRes, mockNext);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockReq.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: [
        'O campo da senha atual é obrigatório.',
        'O campo da nova senha é obrigatória.',
        'O campo de confirmação da nova senha é obrigatório.',
      ],
    });
  });
});
