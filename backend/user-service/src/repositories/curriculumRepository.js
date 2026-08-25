const prisma = require('../config/prisma');

const findByPersonId = (authUserId) => {
  return prisma.curriculum.findUnique({
    where: { personId: authUserId },
    select: { fileKey: true, type: true },
  });
};

const upsert = (dataCurriculum) => {
  const { personId, ...curriculumData } = dataCurriculum;
  return prisma.curriculum.upsert({
    where: { personId },
    update: curriculumData,
    create: dataCurriculum,
  });
};

const update = (authUserId, dataCurriculum) => {
  return prisma.curriculum.update({
    where: { personId: authUserId },
    data: dataCurriculum,
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
