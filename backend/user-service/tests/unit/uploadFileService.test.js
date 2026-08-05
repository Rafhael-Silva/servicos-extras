const uploadFile = require('../../src/services/uploadFileService');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../src/config/storage');
const logger = require('../../src/config/logger');
const AppError = require('../../errors/AppError');

jest.mock('@aws-sdk/client-s3');
jest.mock('../../src/config/storage');
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('uploadFileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve realizar o upload com sucesso', async () => {
    const bufferFake = Buffer.from('pic.pdf');
    const keyFake = 'curriculums/user123/pic.pdf';

    s3Client.send.mockResolvedValue({});

    const result = await uploadFile(bufferFake, keyFake);

    expect(result).toBe(keyFake);
    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: keyFake,
      Body: bufferFake,
    });
  });
  test('deve lançar AppError quando ocorrer erro ao fazer upload', async () => {
    const bufferFake = Buffer.from('pic.pdf');
    const keyFake = 'curriculums/user123/pic.pdf';

    s3Client.send.mockRejectedValue(new Error('Falha AWS'));

    try {
      await uploadFile(bufferFake, keyFake);

      fail('Deveria ter lançado erro.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Erro ao fazer upload para s3.');
    }

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao fazer upload do arquivo.',
    );
  });
});
