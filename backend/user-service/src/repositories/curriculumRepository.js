const prisma = require('../config/prisma');

const findByPersonId = (authUserId) => {
  return prisma.curriculum.findUnique({
    where: { personId: authUserId },
    select: { fileKey: true, type: true },
  });
};

const upsert = (data) => {
  const { personId, ...curriculumData } = data;
  return prisma.curriculum.upsert({
    where: { personId },
    update: curriculumData,
    create: data,
  });
};

const update = (authUserId, data) => {
  return prisma.curriculum.update({
    where: { personId: authUserId },
    data,
    select: {
      professionalSummary: true,
      experiences: true,
      educations: true,
      courses: true,
      skills: true,
      observations: true,
    },
  });
};

module.exports = {
  findByPersonId,
  upsert,
  update,
};
