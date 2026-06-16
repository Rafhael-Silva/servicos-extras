const jwt = require('jsonwebtoken');
const { UserRole, VerificationType } = require('@prisma/client');
const {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
} = require('../../src/utils/generateToken');

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('utils - generateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('deve gerar accessToken com sucesso.', () => {
    const mockPayload = {
      id: 'user123',
      role: UserRole.CANDIDATO,
    };
    const mockToken = 'accessToken_fake';
    process.env.ACCESS_TOKEN_SECRET = 'secret_fake';

    jwt.sign.mockReturnValue(mockToken);

    const result = generateAccessToken(mockPayload);

    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' },
    );
    expect(result).toBe(mockToken);
  });
  test('deve gerar refreshToken com sucesso.', () => {
    const mockPayload = {
      id: 'user123',
    };
    const mockToken = 'refreshToken_fake';
    process.env.REFRESH_TOKEN_SECRET = 'secret_fake';

    jwt.sign.mockReturnValue(mockToken);

    const result = generateRefreshToken(mockPayload);

    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' },
    );
    expect(result).toBe(mockToken);
  });
  test('deve gerar verificationToken com sucesso.', () => {
    const mockPayload = {
      userId: 'user123',
      type: VerificationType.EMAIL_VERIFICATION,
    };
    const mockToken = 'verificationToken_fake';
    process.env.VERIFICATION_TOKEN_SECRET = 'secret_fake';

    jwt.sign.mockReturnValue(mockToken);

    const result = generateVerificationToken(mockPayload);

    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      process.env.VERIFICATION_TOKEN_SECRET,
      { expiresIn: '5m' },
    );
    expect(result).toBe(mockToken);
  });
});
