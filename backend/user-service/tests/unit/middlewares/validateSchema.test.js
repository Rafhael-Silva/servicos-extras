const { validateSchema } = require('../../../src/middlewares');

describe('middlewares - validateSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve validar com sucesso.', () => {
    const validatedData = {
      authUserId: 'user123',
      phone: '45676453215',
    };
    const mockReq = {
      body: {
        authUserId: 'user123',
        phone: '45676453215',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();
    const mockSchema = {
      validate: jest.fn().mockReturnValue({
        error: undefined,
        value: validatedData,
      }),
    };

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
            { message: 'O campo telefone é obrigatório.' },
            { message: 'O campo telefone não pode estar vazio.' },
            { message: 'O campo telefone deve conter 11 dígitos.' },
          ],
        },
        value: undefined,
      }),
    };
    const mockReq = {
      body: {
        phone: undefined,
        bio: 'teste',
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
        'O campo telefone é obrigatório.',
        'O campo telefone não pode estar vazio.',
        'O campo telefone deve conter 11 dígitos.',
      ],
    });
  });
});
