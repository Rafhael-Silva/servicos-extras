const validateSchema = require('../../src/middlewares/validateSchema');

describe('middlewares - validateSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve validar com sucesso.', () => {
    const validatedData = {
      id: 'user123',
      name: 'João',
      role: 'CANDIDATO',
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
        role: 'CANDIDATO',
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
            { message: 'Senha atual incorreta.' },
            { message: 'Nova senha é obrigatória.' },
            { message: 'Confirmação da senha é obrigatória.' },
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
    expect(mockReq).not.toHaveProperty('validatedBody');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      type: 'ValidationError',
      message: 'Erro de validação nos dados enviados.',
      errors: [
        'Senha atual incorreta.',
        'Nova senha é obrigatória.',
        'Confirmação da senha é obrigatória.',
      ],
    });
  });
});
