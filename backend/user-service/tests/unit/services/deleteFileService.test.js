jest.mock('@aws-sdk/client-s3');
jest.mock('../../../src/config/storage');
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const deleteFile = require('../../../src/services/deleteFileService');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../../src/config/storage');
const logger = require('../../../src/config/logger');
const AppError = require('../../../errors/AppError');

describe('deleteFileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve deletar arquivo com sucesso', async () => {
    const keyFake = 'curriculums/user123/pic.pdf';

    s3Client.send.mockResolvedValue({});

    await deleteFile(keyFake);

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: keyFake,
    });
    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });
  test('deve lançar AppError quando ocorrer erro ao deletar arquivo', async () => {
    const keyFake = 'curriculums/user123/pic.pdf';

    s3Client.send.mockRejectedValue(new Error('Falha AWS'));

    try {
      await deleteFile(keyFake);

      fail('deveria ter lançado erro.');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Erro ao deletar arquivo.');
    }

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Erro ao deletar arquivo.');
  });
});
