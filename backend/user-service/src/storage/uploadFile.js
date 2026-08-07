const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const AppError = require('../../errors/AppError');
const logger = require('../config/logger');

const uploadFile = async (buffer, key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
    });

    await s3Client.send(command);

    return key;
  } catch (error) {
    logger.error('Erro ao fazer upload do arquivo.');
    throw new AppError('Erro ao fazer upload para s3.', {
      error: error.message,
    });
  }
};

module.exports = uploadFile;
