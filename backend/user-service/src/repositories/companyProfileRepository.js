const prisma = require('../config/prisma');

const findByAuthUserId = (authUserId) => {
  return prisma.companyProfile.findUnique({
    where: { authUserId },
    select: { authUserId: true, logoKey: true },
  });
};

const getMyProfile = (authUserId) => {
  return prisma.companyProfile.findUnique({
    where: { authUserId },
    include: {
      address: true,
    },
  });
};

const getPublicProfile = (companyId) => {
  return prisma.companyProfile.findUnique({
    where: { authUserId: companyId },
    select: {
      companyName: true,
      logoKey: true,
      bio: true,
      address: {
        select: {
          state: true,
          city: true,
          neighborhood: true,
        },
      },
    },
  });
};

const create = (dataCompany) => {
  return prisma.companyProfile.create({
    data: dataCompany,
    select: {
      authUserId: true,
      companyName: true,
      phone: true,
      logoKey: true,
      bio: true,
    },
  });
};

const update = (authUserId, dataCompany) => {
  return prisma.companyProfile.update({
    where: { authUserId },
    data: dataCompany,
    select: { companyName: true, phone: true, logoKey: true, bio: true },
  });
};

module.exports = {
  findByAuthUserId,
  getMyProfile,
  getPublicProfile,
  create,
  update,
};
