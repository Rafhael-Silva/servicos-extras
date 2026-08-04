const { prisma } = require('../config');

const createUser = (newUser) => {
  return prisma.user.create({
    data: newUser,
  });
};

const markEmailAsVerified = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
    select: {
      id: true,
      name: true,
      email: true,
      accountType: true,
    },
  });
};

const unlockUser = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: false,
      loginAttempts: 0,
      blockExpires: null,
    },
  });
};

const resetLoginAttempts = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: 0,
    },
  });
};

const incrementLoginAttempts = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: {
        increment: 1,
      },
    },
    select: { loginAttempts: true },
  });
};

const blockUser = (userId, blockExpires) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: true,
      blockExpires,
    },
  });
};

const updateLastLogin = (userId, lastLoginAt) => {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt },
  });
};

const updatePassword = (userId, passwordHash) => {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};

const findLoginData = (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      emailVerified: true,
      accountType: true,
      isBlocked: true,
      loginAttempts: true,
      blockExpires: true,
    },
  });
};

const findProfileData = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      accountType: true,
      birthDate: true,
    },
  });
};

const findById = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      accountType: true,
      email: true,
    },
  });
};

const findByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
    },
  });
};

const findByCpf = (cpf) => {
  return prisma.user.findUnique({
    where: { cpf },
    select: {
      id: true,
    },
  });
};

const findByCnpj = (cnpj) => {
  return prisma.user.findUnique({
    where: { cnpj },
    select: {
      id: true,
    },
  });
};

const findPasswordHash = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
};

const findTokenValidationData = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accountType: true,
      isBlocked: true,
    },
  });
};

const findBlockStatus = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isBlocked: true,
      blockExpires: true,
    },
  });
};

module.exports = {
  createUser,
  markEmailAsVerified,
  unlockUser,
  resetLoginAttempts,
  incrementLoginAttempts,
  blockUser,
  updateLastLogin,
  updatePassword,
  findLoginData,
  findProfileData,
  findById,
  findByEmail,
  findByCpf,
  findByCnpj,
  findPasswordHash,
  findTokenValidationData,
  findBlockStatus,
};
