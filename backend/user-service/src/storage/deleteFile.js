const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const AppError = require('../../errors/AppError');
const logger = require('../config/logger');

const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error('Erro ao deletar arquivo.');
    throw new AppError('Erro ao deletar arquivo.', {
      error: error.message,
    });
  }
};

module.exports = deleteFile;
