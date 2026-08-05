const prisma = require('../config/prisma');

const countRecentValidCodes = (userId, type, now, windowStart) => {
  return prisma.verificationCode.count({
    where: {
      userId,
      type,
      used: false,
      expiresAt: { gt: now },
      createdAt: { gte: windowStart },
    },
  });
};

const replaceVerificationCode = (userId, type, codeHash, now, expiresAt) => {
  return prisma.$transaction([
    prisma.verificationCode.deleteMany({
      where: {
        userId,
        type,
        used: false,
        expiresAt: { gt: now },
      },
    }),
    prisma.verificationCode.create({
      data: {
        userId,
        codeHash,
        type,
        expiresAt,
        attempts: 0,
        used: false,
      },
    }),
  ]);
};

const deleteExpiredCodes = (userId, now) => {
  return prisma.verificationCode.deleteMany({
    where: {
      userId,
      expiresAt: { lt: now },
    },
  });
};

const findLatestValidCode = (userId, type, now) => {
  return prisma.verificationCode.findFirst({
    where: {
      userId,
      type,
      expiresAt: { gt: now },
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const markCodeAsUsed = (codeId) => {
  return prisma.verificationCode.update({
    where: {
      id: codeId,
    },
    data: {
      used: true,
    },
  });
};

const incrementCodeAttempts = (codeId) => {
  return prisma.verificationCode.update({
    where: {
      id: codeId,
    },
    data: {
      attempts: {
        increment: 1,
      },
    },
    select: { attempts: true },
  });
};

const consumeCode = (codeId) => {
  return prisma.verificationCode.updateMany({
    where: {
      id: codeId,
      used: false,
    },
    data: {
      used: true,
    },
  });
};

const cleanupVerificationCodes = () => {
  return prisma.verificationCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

module.exports = {
  countRecentValidCodes,
  replaceVerificationCode,
  deleteExpiredCodes,
  findLatestValidCode,
  markCodeAsUsed,
  incrementCodeAttempts,
  consumeCode,
  cleanupVerificationCodes,
};
