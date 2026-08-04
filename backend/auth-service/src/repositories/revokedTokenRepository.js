const { prisma } = require('../config');

const createRevokedToken = (tokenHash, expiresAt) => {
  return prisma.revokedToken.create({
    data: {
      tokenHash,
      expiresAt,
    },
  });
};

const findByTokenHash = (tokenHash) => {
  return prisma.revokedToken.findUnique({
    where: { tokenHash },
  });
};

const cleanupRevokedTokens = () => {
  return prisma.revokedToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

module.exports = {
  createRevokedToken,
  cleanupRevokedTokens,
  findByTokenHash,
};
