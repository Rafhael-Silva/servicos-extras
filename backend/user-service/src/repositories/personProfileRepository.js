const prisma = require('../config/prisma');

const findByAuthUserId = (authUserId) => {
  return prisma.personProfile.findUnique({
    where: { authUserId },
    select: { authUserId: true, photoKey: true },
  });
};

const getMyProfile = (authUserId) => {
  return prisma.personProfile.findUnique({
    where: { authUserId },
    include: {
      address: true,
      curriculum: true,
    },
  });
};

const getPublicProfile = (personId) => {
  return prisma.personProfile.findUnique({
    where: { authUserId: personId },
    select: {
      photoKey: true,
      bio: true,
      address: {
        select: {
          state: true,
          city: true,
          neighborhood: true,
        },
      },
      curriculum: {
        select: {
          type: true,
          fileKey: true,
          professionalSummary: true,
          experiences: true,
          educations: true,
          courses: true,
          skills: true,
          observations: true,
        },
      },
    },
  });
};

const create = (dataProfile) => {
  return prisma.personProfile.create({
    data: dataProfile,
    select: {
      authUserId: true,
      phone: true,
      photoKey: true,
      bio: true,
    },
  });
};

const update = (authUserId, dataProfile) => {
  return prisma.personProfile.update({
    where: { authUserId },
    data: dataProfile,
    select: { authUserId: true, phone: true, photoKey: true, bio: true },
  });
};

module.exports = {
  findByAuthUserId,
  getMyProfile,
  getPublicProfile,
  create,
  update,
};
