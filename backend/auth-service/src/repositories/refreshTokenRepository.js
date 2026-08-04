const { prisma } = require('../config');

const createRefreshToken = (userId, tokenHash, expiresAt) => {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
};

const deleteByTokenHash = (tokenHash) => {
  return prisma.refreshToken.deleteMany({
    where: { tokenHash },
  });
};

const deleteByUserId = (userId) => {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

const findByTokenHash = (tokenHash) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
};

const cleanupRefreshTokens = () => {
  return prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

module.exports = {
  createRefreshToken,
  deleteByTokenHash,
  deleteByUserId,
  findByTokenHash,
  cleanupRefreshTokens,
};
